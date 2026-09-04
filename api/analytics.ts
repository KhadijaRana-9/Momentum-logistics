import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { collection } from './_lib/db.js';
import { COLLECTIONS, type AnalyticsEventDoc, type LeadDoc } from './_lib/models.js';
import { json, route } from './_lib/http.js';
import { requirePermission } from './_lib/auth.js';
import { intParam } from './_lib/params.js';
import { rateLimit } from './_lib/rateLimit.js';
import { sanitizeText } from './_lib/validation.js';

/**
 * Analytics endpoint, split by HTTP method rather than path (no dynamic
 * routing needed, which keeps this reliable under Vercel's non-framework
 * function router):
 *   GET  /api/analytics  -> CRM summary (authed)
 *   POST /api/analytics  -> public event ingest (client posts a batch)
 */
export default route({
  GET: summary,
  POST: ingestEvents,
});

// ---------------------------------------------------------------------------
// GET /api/analytics
// ---------------------------------------------------------------------------
async function summary(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'analytics:view');
  const days = intParam(req, 'days', 30, { min: 1, max: 365 });
  const since = new Date(Date.now() - days * 86_400_000);

  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const events = await collection<AnalyticsEventDoc>(COLLECTIONS.analyticsEvents);
  const followups = await collection(COLLECTIONS.followups);
  const base = { archived: { $ne: true } };
  const now = new Date();

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    hotLeads,
    demoRequests,
    wonDeals,
    lostDeals,
    pendingFollowups,
    overdueFollowups,
    byStatus,
    bySource,
    byProduct,
    byIndustry,
    leadsOverTime,
    eventTotals,
  ] = await Promise.all([
    leads.countDocuments(base),
    leads.countDocuments({ ...base, createdAt: { $gte: since } }),
    leads.countDocuments({ ...base, status: { $in: ['Qualified', 'Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Negotiation'] } }),
    leads.countDocuments({ ...base, temperature: 'Hot' }),
    leads.countDocuments({ ...base, serviceType: 'Demo', createdAt: { $gte: since } }),
    leads.countDocuments({ ...base, status: 'Won' }),
    leads.countDocuments({ ...base, status: 'Lost' }),
    followups.countDocuments({ status: 'Pending' }),
    followups.countDocuments({ status: 'Pending', dueAt: { $lt: now } }),
    leads.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    leads.aggregate([{ $match: base }, { $group: { _id: '$attribution.source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    leads.aggregate([{ $match: base }, { $group: { _id: '$productInterest', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    leads.aggregate([{ $match: { ...base, industry: { $nin: [null, ''] } } }, { $group: { _id: '$industry', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray(),
    leads.aggregate([
      { $match: { ...base, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
    events.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  const wonAndLost = wonDeals + lostDeals;
  const conversionRate = wonAndLost > 0 ? Math.round((wonDeals / wonAndLost) * 1000) / 10 : 0;

  const funnelOrder = ['New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Negotiation', 'Won'];
  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const funnel = funnelOrder.map((stage) => ({ stage, count: statusMap[stage] ?? 0 }));

  const eventMap = Object.fromEntries(eventTotals.map((e) => [e._id, e.count]));

  json(res, 200, {
    rangeDays: days,
    overview: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      hotLeads,
      demoRequests,
      pendingFollowups,
      overdueFollowups,
      wonDeals,
      lostDeals,
      conversionRate,
    },
    pipeline: funnel,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    bySource: bySource.map((s) => ({ source: s._id ?? 'Unknown', count: s.count })),
    byProduct: byProduct.map((s) => ({ product: s._id ?? 'Unspecified', count: s.count })),
    byIndustry: byIndustry.map((s) => ({ industry: s._id, count: s.count })),
    leadsOverTime: leadsOverTime.map((d) => ({ date: d._id, count: d.count })),
    events: {
      pageViews: eventMap.page_view ?? 0,
      productViews: eventMap.product_view ?? 0,
      ctaClicks: eventMap.cta_click ?? 0,
      demoRequests: eventMap.demo_request ?? 0,
      chatbotStarted: eventMap.chatbot_started ?? 0,
      chatbotCompleted: eventMap.chatbot_completed ?? 0,
      conversions: eventMap.conversion ?? 0,
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/analytics
// ---------------------------------------------------------------------------
const ALLOWED_EVENTS = new Set([
  'page_view',
  'product_view',
  'cta_click',
  'demo_request',
  'quote_request',
  'contact_submit',
  'consultation_request',
  'chatbot_started',
  'chatbot_completed',
  'lead_created',
  'demo_scheduled',
  'conversion',
  'webinar_registered',
]);

const MAX_BATCH = 20;

function shallowProps(input: unknown): Record<string, unknown> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n++ >= 12) break;
    if (typeof v === 'string') out[k] = sanitizeText(v).slice(0, 200);
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

async function ingestEvents(req: VercelRequest, res: VercelResponse) {
  await rateLimit(req, { name: 'analytics', limit: 120, windowMs: 60_000 });

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as Record<string, unknown>;
  const rawEvents = Array.isArray(body.events) ? body.events : [body];

  const now = new Date();
  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : undefined;

  const docs: AnalyticsEventDoc[] = [];
  for (const raw of rawEvents.slice(0, MAX_BATCH)) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    const event = typeof e.event === 'string' ? e.event.trim() : '';
    if (!ALLOWED_EVENTS.has(event)) continue;

    const leadIdRaw = typeof e.leadId === 'string' && ObjectId.isValid(e.leadId) ? new ObjectId(e.leadId) : undefined;

    docs.push({
      event,
      anonymousId: typeof e.anonymousId === 'string' ? e.anonymousId.slice(0, 64) : undefined,
      sessionId: typeof e.sessionId === 'string' ? e.sessionId.slice(0, 64) : undefined,
      leadId: leadIdRaw,
      path: typeof e.path === 'string' ? sanitizeText(e.path).slice(0, 300) : undefined,
      props: shallowProps(e.props),
      attribution:
        e.attribution && typeof e.attribution === 'object'
          ? (shallowProps(e.attribution) as AnalyticsEventDoc['attribution'])
          : undefined,
      ua,
      createdAt: now,
    });
  }

  if (docs.length) {
    const col = await collection<AnalyticsEventDoc>(COLLECTIONS.analyticsEvents);
    await col.insertMany(docs, { ordered: false });
  }

  json(res, 202, { ok: true, accepted: docs.length });
}

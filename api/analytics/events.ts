import { ObjectId } from 'mongodb';
import { collection } from '../_lib/db.ts';
import { COLLECTIONS, type AnalyticsEventDoc } from '../_lib/models.ts';
import { json, route } from '../_lib/http.ts';
import { rateLimit } from '../_lib/rateLimit.ts';
import { sanitizeText } from '../_lib/validation.ts';

/**
 * Public analytics ingest. Accepts a small batch of business events per request
 * to keep write volume bounded. No PII is stored — only an anonymous id the
 * client generates, the path, and a shallow props object.
 */
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

export default route({
  POST: async (req, res) => {
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
  },
});

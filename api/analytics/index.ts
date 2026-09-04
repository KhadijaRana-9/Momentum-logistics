import { collection } from '../_lib/db.ts';
import { COLLECTIONS, type AnalyticsEventDoc, type LeadDoc } from '../_lib/models.ts';
import { json, route } from '../_lib/http.ts';
import { requirePermission } from '../_lib/auth.ts';
import { intParam } from '../_lib/params.ts';

/**
 * CRM analytics summary. Everything is computed with server-side aggregation
 * pipelines against indexed fields — no unbounded scans, no client math.
 */
export default route({
  GET: async (req, res) => {
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
  },
});

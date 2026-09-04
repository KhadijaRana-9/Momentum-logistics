import type { ObjectId, WithId } from 'mongodb';
import { collection } from './db.js';
import { COLLECTIONS, type LeadDoc } from './models.js';
import { scoreLead } from './leadScoring.js';
import { logActivity, countActivities } from './activity.js';

/**
 * Recomputes a lead's deterministic score from its current stored fields and
 * persists it, logging an activity only when the score or temperature moved.
 */
export async function rescoreLead(leadId: ObjectId, actorName = 'System'): Promise<WithId<LeadDoc>> {
  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const lead = (await leads.findOne({ _id: leadId }))!;
  const activityCount = await countActivities(leadId);

  const { score, factors, temperature } = scoreLead({
    productInterest: lead.productInterest,
    serviceType: lead.serviceType,
    industry: lead.industry,
    companySize: lead.companySize,
    isBusinessEmail: lead.isBusinessEmail,
    budget: lead.budget,
    timeline: lead.timeline,
    company: lead.company,
    phone: lead.phone,
    attribution: lead.attribution,
    submissionsCount: lead.submissionsCount,
    activityCount,
  });

  if (score === lead.score && temperature === lead.temperature) return lead;

  await leads.updateOne(
    { _id: leadId },
    { $set: { score, scoreFactors: factors, temperature, updatedAt: new Date() } },
  );
  await logActivity({
    leadId,
    type: 'score_recalculated',
    title: `Lead score updated to ${score} (${temperature})`,
    actorName,
    meta: { score, temperature, previousScore: lead.score },
  });

  return { ...lead, score, scoreFactors: factors, temperature };
}

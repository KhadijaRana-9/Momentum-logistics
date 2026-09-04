import { ObjectId } from 'mongodb';
import { collection } from './db.ts';
import {
  COLLECTIONS,
  type Attribution,
  type LeadDoc,
  type ProductInterest,
  type ServiceType,
  type SubmissionDoc,
  type SubmissionType,
} from './models.ts';
import { nextRef } from './ids.ts';
import { isBusinessEmail, normalizeEmail, normalizePhone } from './validation.ts';
import { scoreLead } from './leadScoring.ts';
import { logActivity, countActivities } from './activity.ts';
import { email as emailService, internalLeadNotificationEmail } from './email.ts';

export interface LeadIntake {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  jobTitle?: string;
  website?: string;
  productInterest: ProductInterest;
  serviceType: ServiceType;
  budget?: string;
  timeline?: string;
  requirements?: string;
  campaign?: string;
  attribution: Attribution;
}

export interface UpsertResult {
  lead: LeadDoc;
  created: boolean;
  submissionId: ObjectId;
}

/**
 * Central entry point for every public lead-generating action.
 *
 * Dedup rule: match an existing, non-archived lead by normalised email first,
 * then by normalised phone. A match is enriched + re-scored and gets a new
 * activity/submission; it is NOT duplicated. A genuinely new identity creates a
 * new lead. Repeat submissions from the same person are legitimate new activity.
 */
export async function captureLead(
  intake: LeadIntake,
  submission: { type: SubmissionType; payload: Record<string, unknown>; ip?: string; userAgent?: string },
): Promise<UpsertResult> {
  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const submissions = await collection<SubmissionDoc>(COLLECTIONS.submissions);
  const now = new Date();

  const emailNormalized = intake.email ? normalizeEmail(intake.email) : undefined;
  const phoneNormalized = intake.phone ? normalizePhone(intake.phone) : undefined;

  const orMatch: Record<string, unknown>[] = [];
  if (emailNormalized) orMatch.push({ emailNormalized });
  if (phoneNormalized) orMatch.push({ phoneNormalized });

  const existing = orMatch.length
    ? await leads.findOne({ archived: { $ne: true }, $or: orMatch })
    : null;

  let leadId: ObjectId;
  let created: boolean;
  let ref: string;

  if (existing) {
    leadId = existing._id!;
    created = false;
    ref = existing.ref;

    // Enrich only missing fields — never overwrite data a human may have curated.
    const enrich: Partial<LeadDoc> = { updatedAt: now, lastActivityAt: now };
    const fill = <K extends keyof LeadDoc>(k: K, v: LeadDoc[K] | undefined) => {
      if (v !== undefined && v !== '' && (existing[k] === undefined || existing[k] === '' || existing[k] === null)) {
        enrich[k] = v;
      }
    };
    fill('email', intake.email);
    fill('emailNormalized', emailNormalized);
    fill('phone', intake.phone);
    fill('phoneNormalized', phoneNormalized);
    fill('company', intake.company);
    fill('companySize', intake.companySize);
    fill('industry', intake.industry);
    fill('jobTitle', intake.jobTitle);
    fill('website', intake.website);
    fill('budget', intake.budget);
    fill('timeline', intake.timeline);
    fill('requirements', intake.requirements);
    if (emailNormalized) enrich.isBusinessEmail = isBusinessEmail(emailNormalized);
    // A demo request always upgrades service intent.
    if (intake.serviceType === 'Demo' || existing.serviceType === 'General') enrich.serviceType = intake.serviceType;
    if (existing.productInterest === 'Unspecified' && intake.productInterest !== 'Unspecified') {
      enrich.productInterest = intake.productInterest;
    }
    // Last-touch attribution updates; first-touch is preserved.
    enrich.attribution = {
      ...existing.attribution,
      lastTouchSource: intake.attribution.lastTouchSource ?? intake.attribution.source,
      source: intake.attribution.source,
      campaign: intake.attribution.campaign ?? existing.attribution.campaign,
      landingPage: intake.attribution.landingPage ?? existing.attribution.landingPage,
    };
    enrich.submissionsCount = (existing.submissionsCount ?? 0) + 1;

    await leads.updateOne({ _id: leadId }, { $set: enrich });
  } else {
    created = true;
    ref = await nextRef('lead', 'LEAD');
    const doc: LeadDoc = {
      ref,
      name: intake.name,
      email: intake.email,
      emailNormalized,
      phone: intake.phone,
      phoneNormalized,
      company: intake.company,
      companySize: intake.companySize,
      industry: intake.industry,
      jobTitle: intake.jobTitle,
      website: intake.website,
      isBusinessEmail: emailNormalized ? isBusinessEmail(emailNormalized) : false,
      productInterest: intake.productInterest,
      serviceType: intake.serviceType,
      budget: intake.budget,
      timeline: intake.timeline,
      requirements: intake.requirements,
      attribution: intake.attribution,
      campaign: intake.campaign ?? intake.attribution.campaign,
      score: 0,
      scoreFactors: [],
      temperature: 'Cold',
      status: 'New',
      priority: 'Medium',
      assignedTo: null,
      assignedToName: null,
      tags: [],
      notesCount: 0,
      submissionsCount: 1,
      followUpAt: null,
      lastActivityAt: now,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    const res = await leads.insertOne(doc);
    leadId = res.insertedId;
  }

  // Raw submission record (immutable).
  const submissionDoc: SubmissionDoc = {
    type: submission.type,
    leadId,
    payload: submission.payload,
    attribution: intake.attribution,
    ip: submission.ip,
    userAgent: submission.userAgent,
    createdAt: now,
  };
  const subRes = await submissions.insertOne(submissionDoc);

  if (created) {
    await logActivity({
      leadId,
      type: 'lead_created',
      title: `Lead created from ${labelForSubmission(submission.type)}`,
      meta: { source: intake.attribution.source, ref },
    });
  }
  await logActivity({
    leadId,
    type: 'form_submitted',
    title: `Submitted ${labelForSubmission(submission.type)}`,
    detail: intake.requirements,
    meta: { submissionId: subRes.insertedId.toString() },
  });

  // Re-score with the freshest data.
  const fresh = (await leads.findOne({ _id: leadId }))!;
  const activityCount = await countActivities(leadId);
  const { score, factors, temperature } = scoreLead({
    productInterest: fresh.productInterest,
    serviceType: fresh.serviceType,
    industry: fresh.industry,
    companySize: fresh.companySize,
    isBusinessEmail: fresh.isBusinessEmail,
    budget: fresh.budget,
    timeline: fresh.timeline,
    company: fresh.company,
    phone: fresh.phone,
    attribution: fresh.attribution,
    submissionsCount: fresh.submissionsCount,
    activityCount,
  });

  if (score !== fresh.score || temperature !== fresh.temperature) {
    await leads.updateOne(
      { _id: leadId },
      { $set: { score, scoreFactors: factors, temperature, updatedAt: new Date() } },
    );
    await logActivity({
      leadId,
      type: 'score_recalculated',
      title: `Lead score updated to ${score} (${temperature})`,
      meta: { score, temperature },
    });
  }

  const lead = (await leads.findOne({ _id: leadId }))!;

  // Best-effort internal notification (never blocks).
  if (emailService.isConfigured && emailService.salesInbox) {
    void emailService
      .send({
        to: emailService.salesInbox,
        subject: `New ${lead.temperature} lead: ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
        html: internalLeadNotificationEmail({
          ref: lead.ref,
          name: lead.name,
          company: lead.company,
          product: lead.productInterest,
          service: lead.serviceType,
          score: lead.score,
          temperature: lead.temperature,
        }),
      })
      .then((r) => {
        if (r.status === 'sent') {
          void logActivity({ leadId, type: 'email_sent', title: 'Internal lead notification sent' });
        }
      });
  }

  return { lead, created, submissionId: subRes.insertedId };
}

export function labelForSubmission(type: SubmissionType): string {
  const map: Record<SubmissionType, string> = {
    demo_request: 'a demo request',
    contact: 'a contact form',
    quote_request: 'a quote request',
    erp_demo: 'an ERP demo request',
    software_consultation: 'a software consultation request',
    fbr_inquiry: 'an FBR invoicing inquiry',
    cloud_ai_inquiry: 'a Cloud & AI inquiry',
    chatbot: 'a chatbot conversation',
    webinar_registration: 'a webinar registration',
    newsletter: 'a newsletter signup',
  };
  return map[type] ?? 'a form';
}

/** Serialises a lead for JSON responses (ObjectIds -> strings, no internal-only fields). */
export function serializeLead(lead: LeadDoc) {
  return {
    id: String(lead._id),
    ref: lead.ref,
    name: lead.name,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    company: lead.company ?? null,
    companySize: lead.companySize ?? null,
    industry: lead.industry ?? null,
    jobTitle: lead.jobTitle ?? null,
    website: lead.website ?? null,
    isBusinessEmail: lead.isBusinessEmail ?? false,
    productInterest: lead.productInterest,
    serviceType: lead.serviceType,
    budget: lead.budget ?? null,
    timeline: lead.timeline ?? null,
    requirements: lead.requirements ?? null,
    attribution: lead.attribution,
    campaign: lead.campaign ?? null,
    score: lead.score,
    scoreFactors: lead.scoreFactors,
    temperature: lead.temperature,
    status: lead.status,
    priority: lead.priority,
    assignedTo: lead.assignedTo ? String(lead.assignedTo) : null,
    assignedToName: lead.assignedToName ?? null,
    tags: lead.tags,
    notesCount: lead.notesCount,
    submissionsCount: lead.submissionsCount,
    followUpAt: lead.followUpAt ?? null,
    lastActivityAt: lead.lastActivityAt,
    archived: lead.archived ?? false,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

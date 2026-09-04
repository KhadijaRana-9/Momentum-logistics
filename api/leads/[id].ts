import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { collection } from '../_lib/db.js';
import {
  COLLECTIONS,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type ActivityType,
  type FollowupDoc,
  type LeadDoc,
  type LeadStatus,
  type SubmissionDoc,
  type UserDoc,
} from '../_lib/models.js';
import { badRequest, json, notFound, route } from '../_lib/http.js';
import { requirePermission } from '../_lib/auth.js';
import { objectIdParam, stringParam } from '../_lib/params.js';
import { validate } from '../_lib/validation.js';
import { serializeLead } from '../_lib/leadService.js';
import { listActivities, logActivity } from '../_lib/activity.js';
import { rescoreLead } from '../_lib/rescore.js';
import { diffFields, writeAudit } from '../_lib/audit.js';

/**
 * Lead detail + id-scoped actions.
 *
 *   GET    /api/leads/:id                    -> detail
 *   PATCH  /api/leads/:id                     -> update
 *   DELETE /api/leads/:id                     -> archive
 *   POST   /api/leads/:id?action=assign       -> assign / unassign
 *   POST   /api/leads/:id?action=status       -> change pipeline stage
 *   POST   /api/leads/:id?action=notes        -> add a note
 *
 * The action lives in the query string rather than an extra path segment:
 * Vercel's non-framework function router only reliably resolves a single
 * dynamic path segment per file outside of Next.js.
 */

const EDITABLE = [
  'name', 'email', 'phone', 'company', 'companySize', 'industry', 'jobTitle',
  'website', 'productInterest', 'serviceType', 'budget', 'timeline', 'requirements',
] as const;

export default route({
  GET: async (req, res) => {
    await requirePermission(req, 'leads:view');
    const id = objectIdParam(req);

    const leads = await collection<LeadDoc>(COLLECTIONS.leads);
    const lead = await leads.findOne({ _id: id });
    if (!lead) throw notFound('Lead not found');

    const [activities, followups, submissions] = await Promise.all([
      listActivities(id, 200),
      (await collection<FollowupDoc>(COLLECTIONS.followups)).find({ leadId: id }).sort({ dueAt: 1 }).toArray(),
      (await collection<SubmissionDoc>(COLLECTIONS.submissions)).find({ leadId: id }).sort({ createdAt: -1 }).limit(50).toArray(),
    ]);

    json(res, 200, {
      lead: serializeLead(lead),
      activities: activities.map((a) => ({
        id: String(a._id),
        type: a.type,
        title: a.title,
        detail: a.detail ?? null,
        actorName: a.actorName,
        meta: a.meta ?? null,
        createdAt: a.createdAt,
      })),
      followups: followups.map((f) => ({
        id: String(f._id),
        dueAt: f.dueAt,
        type: f.type,
        status: f.status,
        priority: f.priority,
        notes: f.notes ?? null,
        assignedToName: f.assignedToName,
        completedAt: f.completedAt ?? null,
      })),
      submissions: submissions.map((s) => ({
        id: String(s._id),
        type: s.type,
        payload: s.payload,
        attribution: s.attribution,
        createdAt: s.createdAt,
      })),
    });
  },

  PATCH: async (req, res) => {
    const session = await requirePermission(req, 'leads:edit');
    const id = objectIdParam(req);

    const leads = await collection<LeadDoc>(COLLECTIONS.leads);
    const current = await leads.findOne({ _id: id });
    if (!current) throw notFound('Lead not found');

    const body = validate<Record<string, unknown>>(
      {
        name: { type: 'string', min: 2, max: 80 },
        email: { type: 'email' },
        phone: { type: 'phone', max: 40 },
        company: { type: 'string', max: 120 },
        companySize: { type: 'string', max: 40 },
        industry: { type: 'string', max: 80 },
        jobTitle: { type: 'string', max: 80 },
        website: { type: 'string', max: 200 },
        budget: { type: 'string', max: 60 },
        timeline: { type: 'string', max: 60 },
        requirements: { type: 'string', max: 4000 },
        priority: { type: 'enum', values: LEAD_PRIORITIES },
        tags: { type: 'stringArray', max: 25 },
        followUpAt: { type: 'string', max: 40 },
      },
      req.body,
    );

    const set: Partial<LeadDoc> = { updatedAt: new Date() };
    for (const key of EDITABLE) {
      if (body[key] !== undefined) (set as Record<string, unknown>)[key] = body[key];
    }
    if (body.priority !== undefined) set.priority = body.priority as LeadDoc['priority'];
    if (body.tags !== undefined) set.tags = body.tags as string[];
    if (body.followUpAt !== undefined) {
      const d = new Date(String(body.followUpAt));
      set.followUpAt = Number.isNaN(d.getTime()) ? null : d;
    }

    const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>)
      .filter((c) => c.field !== 'updatedAt');
    if (changes.length === 0) {
      json(res, 200, { lead: serializeLead(current) });
      return;
    }

    await leads.updateOne({ _id: id }, { $set: set });

    if (body.tags !== undefined) {
      await logActivity({ leadId: id, type: 'tag_added', title: `Tags updated: ${(body.tags as string[]).join(', ') || 'none'}`, actorId: session.id, actorName: session.name });
    }
    if (body.priority !== undefined && body.priority !== current.priority) {
      await logActivity({ leadId: id, type: 'priority_changed', title: `Priority changed to ${body.priority}`, actorName: session.name });
    }

    const scoreImpacting = ['industry', 'companySize', 'budget', 'timeline', 'company', 'phone', 'email'];
    let lead = (await leads.findOne({ _id: id }))!;
    if (changes.some((c) => scoreImpacting.includes(c.field))) {
      lead = await rescoreLead(id, session.name);
    }

    await writeAudit({ actor: session, action: 'lead.updated', entity: 'lead', entityId: current.ref, changes, req });

    json(res, 200, { lead: serializeLead(lead) });
  },

  DELETE: async (req, res) => {
    const session = await requirePermission(req, 'leads:delete');
    const id = objectIdParam(req);
    const leads = await collection<LeadDoc>(COLLECTIONS.leads);
    const current = await leads.findOne({ _id: id });
    if (!current) throw notFound('Lead not found');

    await leads.updateOne({ _id: id }, { $set: { archived: true, updatedAt: new Date() } });
    await writeAudit({ actor: session, action: 'lead.archived', entity: 'lead', entityId: current.ref, req });
    json(res, 200, { ok: true, archived: true });
  },

  POST: async (req, res) => {
    const action = stringParam(req, 'action');
    const id = objectIdParam(req);

    if (action === 'assign') return assignLead(req, res, id);
    if (action === 'status') return setStatus(req, res, id);
    if (action === 'notes') return addNote(req, res, id);
    throw notFound('Unknown action');
  },
});

// ---------------------------------------------------------------------------
async function assignLead(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'leads:assign');

  const body = validate<{ userId?: string }>({ userId: { type: 'string', max: 40 } }, req.body);

  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const lead = await leads.findOne({ _id: id });
  if (!lead) throw notFound('Lead not found');

  let assignedTo: ObjectId | null = null;
  let assignedToName: string | null = null;

  if (body.userId) {
    if (!ObjectId.isValid(body.userId)) throw badRequest('Invalid userId');
    const users = await collection<UserDoc>(COLLECTIONS.users);
    const target = await users.findOne({ _id: new ObjectId(body.userId), status: { $ne: 'suspended' } });
    if (!target) throw badRequest('That user cannot be assigned leads');
    assignedTo = target._id!;
    assignedToName = target.name;
  }

  const from = lead.assignedToName ?? 'Unassigned';
  await leads.updateOne({ _id: id }, { $set: { assignedTo, assignedToName, updatedAt: new Date() } });
  await logActivity({
    leadId: id,
    type: 'lead_assigned',
    title: assignedToName ? `Assigned to ${assignedToName}` : 'Unassigned',
    actorId: session.id,
    actorName: session.name,
  });
  await writeAudit({
    actor: session,
    action: 'lead.assigned',
    entity: 'lead',
    entityId: lead.ref,
    changes: [{ field: 'assignedTo', from, to: assignedToName ?? 'Unassigned' }],
    req,
  });

  const updated = (await leads.findOne({ _id: id }))!;
  json(res, 200, { lead: serializeLead(updated) });
}

// ---------------------------------------------------------------------------
const PIPELINE: LeadStatus[] = [...LEAD_STATUSES];
const STATUS_ACTIVITY: Partial<Record<LeadStatus, ActivityType>> = {
  'Demo Scheduled': 'demo_scheduled',
  'Demo Completed': 'demo_completed',
  'Proposal Sent': 'proposal_sent',
  Won: 'lead_won',
  Lost: 'lead_lost',
};

async function setStatus(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'leads:edit');

  const body = validate<{ status: string; reason?: string }>(
    { status: { type: 'enum', values: LEAD_STATUSES, required: true }, reason: { type: 'string', max: 500 } },
    req.body,
  );
  const next = body.status as LeadStatus;

  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const lead = await leads.findOne({ _id: id });
  if (!lead) throw notFound('Lead not found');
  if (lead.status === next) {
    json(res, 200, { lead: serializeLead(lead) });
    return;
  }

  if ((lead.status === 'Won' || lead.status === 'Lost') && PIPELINE.indexOf(next) > PIPELINE.indexOf(lead.status)) {
    throw badRequest(`Lead is ${lead.status}; reopen it to an earlier stage first`);
  }
  if (next === 'Lost' && !body.reason) throw badRequest('A reason is required when marking a lead Lost');

  const now = new Date();
  await leads.updateOne(
    { _id: id },
    { $set: { status: next, updatedAt: now, ...(next === 'Won' || next === 'Lost' ? { followUpAt: null } : {}) } },
  );

  await logActivity({
    leadId: id,
    type: STATUS_ACTIVITY[next] ?? 'status_changed',
    title: `Status: ${lead.status} → ${next}`,
    detail: body.reason,
    actorId: session.id,
    actorName: session.name,
  });
  await writeAudit({
    actor: session,
    action: 'lead.status_changed',
    entity: 'lead',
    entityId: lead.ref,
    changes: [{ field: 'status', from: lead.status, to: next }],
    meta: body.reason ? { reason: body.reason } : undefined,
    req,
  });

  const updated = (await leads.findOne({ _id: id }))!;
  json(res, 200, { lead: serializeLead(updated) });
}

// ---------------------------------------------------------------------------
async function addNote(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'leads:edit');

  const body = validate<{ note: string }>({ note: { type: 'string', required: true, min: 1, max: 4000 } }, req.body);

  const leads = await collection<LeadDoc>(COLLECTIONS.leads);
  const lead = await leads.findOne({ _id: id });
  if (!lead) throw notFound('Lead not found');

  await logActivity({
    leadId: id,
    type: 'note_added',
    title: 'Note added',
    detail: body.note,
    actorId: session.id,
    actorName: session.name,
  });
  await leads.updateOne({ _id: id }, { $inc: { notesCount: 1 }, $set: { updatedAt: new Date() } });
  await writeAudit({ actor: session, action: 'lead.note_added', entity: 'lead', entityId: lead.ref, req });

  json(res, 201, { ok: true, notesCount: (lead.notesCount ?? 0) + 1 });
}

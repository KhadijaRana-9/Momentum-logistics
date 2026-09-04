import { collection } from '../_lib/db.ts';
import {
  COLLECTIONS,
  LEAD_PRIORITIES,
  type FollowupDoc,
  type LeadDoc,
  type SubmissionDoc,
} from '../_lib/models.ts';
import { json, notFound, route } from '../_lib/http.ts';
import { requirePermission } from '../_lib/auth.ts';
import { objectIdParam } from '../_lib/params.ts';
import { validate } from '../_lib/validation.ts';
import { serializeLead } from '../_lib/leadService.ts';
import { listActivities, logActivity } from '../_lib/activity.ts';
import { rescoreLead } from '../_lib/rescore.ts';
import { diffFields, writeAudit } from '../_lib/audit.ts';

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

    // Fields that affect the score.
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
});

import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../_lib/db.ts';
import {
  COLLECTIONS,
  FOLLOWUP_TYPES,
  LEAD_PRIORITIES,
  type FollowupDoc,
  type LeadDoc,
  type UserDoc,
} from '../_lib/models.ts';
import { badRequest, json, notFound, route } from '../_lib/http.ts';
import { requirePermission } from '../_lib/auth.ts';
import { validate } from '../_lib/validation.ts';
import { intParam, stringParam } from '../_lib/params.ts';
import { logActivity } from '../_lib/activity.ts';
import { writeAudit } from '../_lib/audit.ts';

function serializeFollowup(f: FollowupDoc) {
  const now = Date.now();
  return {
    id: String(f._id),
    leadId: String(f.leadId),
    leadRef: f.leadRef,
    assignedTo: String(f.assignedTo),
    assignedToName: f.assignedToName,
    dueAt: f.dueAt,
    type: f.type,
    notes: f.notes ?? null,
    status: f.status,
    priority: f.priority,
    completedAt: f.completedAt ?? null,
    overdue: f.status === 'Pending' && f.dueAt.getTime() < now,
    createdAt: f.createdAt,
  };
}

export default route({
  GET: async (req, res) => {
    const session = await requirePermission(req, 'followups:view');

    const page = intParam(req, 'page', 1, { min: 1 });
    const limit = intParam(req, 'limit', 50, { min: 1, max: 200 });
    const scope = stringParam(req, 'scope'); // today | upcoming | overdue | completed | all
    const mine = stringParam(req, 'assignedTo') === 'me';

    const filter: Filter<FollowupDoc> = {};
    if (mine) filter.assignedTo = new ObjectId(session.id);

    const leadId = stringParam(req, 'leadId');
    if (leadId && ObjectId.isValid(leadId)) filter.leadId = new ObjectId(leadId);

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    switch (scope) {
      case 'today':
        filter.status = 'Pending';
        filter.dueAt = { $lte: endOfToday };
        break;
      case 'upcoming':
        filter.status = 'Pending';
        filter.dueAt = { $gt: endOfToday };
        break;
      case 'overdue':
        filter.status = 'Pending';
        filter.dueAt = { $lt: now };
        break;
      case 'completed':
        filter.status = 'Completed';
        break;
      case 'all':
        break;
      default:
        filter.status = 'Pending';
    }

    const col = await collection<FollowupDoc>(COLLECTIONS.followups);
    const [items, total] = await Promise.all([
      col.find(filter).sort({ dueAt: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    json(res, 200, { items: items.map(serializeFollowup), page, limit, total });
  },

  POST: async (req, res) => {
    const session = await requirePermission(req, 'followups:manage');

    const body = validate<Record<string, string>>(
      {
        leadId: { type: 'string', required: true, max: 40 },
        dueAt: { type: 'string', required: true, max: 40 },
        type: { type: 'enum', values: FOLLOWUP_TYPES, default: 'Call' },
        priority: { type: 'enum', values: LEAD_PRIORITIES, default: 'Medium' },
        notes: { type: 'string', max: 2000 },
        assignedTo: { type: 'string', max: 40 },
      },
      req.body,
    );

    if (!ObjectId.isValid(body.leadId)) throw badRequest('Invalid leadId');
    const due = new Date(body.dueAt);
    if (Number.isNaN(due.getTime())) throw badRequest('Invalid dueAt date');

    const leads = await collection<LeadDoc>(COLLECTIONS.leads);
    const lead = await leads.findOne({ _id: new ObjectId(body.leadId) });
    if (!lead) throw notFound('Lead not found');

    let assignedTo = new ObjectId(session.id);
    let assignedToName = session.name;
    if (body.assignedTo && ObjectId.isValid(body.assignedTo) && body.assignedTo !== session.id) {
      const users = await collection<UserDoc>(COLLECTIONS.users);
      const target = await users.findOne({ _id: new ObjectId(body.assignedTo), status: { $ne: 'suspended' } });
      if (!target) throw badRequest('Cannot assign follow-up to that user');
      assignedTo = target._id!;
      assignedToName = target.name;
    }

    const now = new Date();
    const doc: FollowupDoc = {
      leadId: lead._id!,
      leadRef: lead.ref,
      assignedTo,
      assignedToName,
      dueAt: due,
      type: (body.type as FollowupDoc['type']) ?? 'Call',
      priority: (body.priority as FollowupDoc['priority']) ?? 'Medium',
      notes: body.notes,
      status: 'Pending',
      completedAt: null,
      createdBy: new ObjectId(session.id),
      createdAt: now,
      updatedAt: now,
    };
    const followups = await collection<FollowupDoc>(COLLECTIONS.followups);
    const result = await followups.insertOne(doc);

    await leads.updateOne({ _id: lead._id }, { $set: { followUpAt: due, updatedAt: now } });
    await logActivity({
      leadId: lead._id!,
      type: 'followup_created',
      title: `Follow-up scheduled (${doc.type}) for ${due.toLocaleDateString('en-GB')}`,
      detail: body.notes,
      actorId: session.id,
      actorName: session.name,
    });
    await writeAudit({ actor: session, action: 'followup.created', entity: 'followup', entityId: String(result.insertedId), meta: { leadRef: lead.ref }, req });

    json(res, 201, { followup: serializeFollowup({ ...doc, _id: result.insertedId }) });
  },
});

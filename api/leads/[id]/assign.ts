import { ObjectId } from 'mongodb';
import { collection } from '../../_lib/db.ts';
import { COLLECTIONS, type LeadDoc, type UserDoc } from '../../_lib/models.ts';
import { badRequest, json, notFound, route } from '../../_lib/http.ts';
import { requirePermission } from '../../_lib/auth.ts';
import { objectIdParam } from '../../_lib/params.ts';
import { validate } from '../../_lib/validation.ts';
import { serializeLead } from '../../_lib/leadService.ts';
import { logActivity } from '../../_lib/activity.ts';
import { writeAudit } from '../../_lib/audit.ts';

export default route({
  POST: async (req, res) => {
    const session = await requirePermission(req, 'leads:assign');
    const id = objectIdParam(req);

    const body = validate<{ userId?: string }>(
      { userId: { type: 'string', max: 40 } },
      req.body,
    );

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
    await leads.updateOne(
      { _id: id },
      { $set: { assignedTo, assignedToName, updatedAt: new Date() } },
    );
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
  },
});

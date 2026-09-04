import { collection } from '../_lib/db.ts';
import { COLLECTIONS, FOLLOWUP_TYPES, LEAD_PRIORITIES, type FollowupDoc } from '../_lib/models.ts';
import { badRequest, json, notFound, route } from '../_lib/http.ts';
import { requirePermission } from '../_lib/auth.ts';
import { objectIdParam } from '../_lib/params.ts';
import { validate } from '../_lib/validation.ts';
import { logActivity } from '../_lib/activity.ts';
import { writeAudit } from '../_lib/audit.ts';

export default route({
  PATCH: async (req, res) => {
    const session = await requirePermission(req, 'followups:manage');
    const id = objectIdParam(req);

    const body = validate<Record<string, string>>(
      {
        status: { type: 'enum', values: ['Pending', 'Completed', 'Cancelled'] },
        dueAt: { type: 'string', max: 40 },
        type: { type: 'enum', values: FOLLOWUP_TYPES },
        priority: { type: 'enum', values: LEAD_PRIORITIES },
        notes: { type: 'string', max: 2000 },
        outcome: { type: 'string', max: 2000 },
      },
      req.body,
    );

    const followups = await collection<FollowupDoc>(COLLECTIONS.followups);
    const current = await followups.findOne({ _id: id });
    if (!current) throw notFound('Follow-up not found');

    const set: Partial<FollowupDoc> = { updatedAt: new Date() };
    if (body.type) set.type = body.type as FollowupDoc['type'];
    if (body.priority) set.priority = body.priority as FollowupDoc['priority'];
    if (body.notes !== undefined) set.notes = body.notes;
    if (body.dueAt) {
      const d = new Date(body.dueAt);
      if (Number.isNaN(d.getTime())) throw badRequest('Invalid dueAt date');
      set.dueAt = d;
    }
    if (body.status) {
      set.status = body.status as FollowupDoc['status'];
      set.completedAt = body.status === 'Completed' ? new Date() : null;
    }

    await followups.updateOne({ _id: id }, { $set: set });

    if (body.status === 'Completed') {
      await logActivity({
        leadId: current.leadId,
        type: 'followup_completed',
        title: `Follow-up completed (${current.type})`,
        detail: body.outcome,
        actorId: session.id,
        actorName: session.name,
      });
      // Clear the lead's followUpAt if no other pending follow-ups remain.
      const remaining = await followups.countDocuments({ leadId: current.leadId, status: 'Pending', _id: { $ne: id } });
      if (remaining === 0) {
        const leads = await collection(COLLECTIONS.leads);
        await leads.updateOne({ _id: current.leadId }, { $set: { followUpAt: null, updatedAt: new Date() } });
      }
    }

    await writeAudit({
      actor: session,
      action: `followup.${body.status?.toLowerCase() ?? 'updated'}`,
      entity: 'followup',
      entityId: String(id),
      meta: { leadRef: current.leadRef },
      req,
    });

    const updated = (await followups.findOne({ _id: id }))!;
    json(res, 200, {
      followup: {
        id: String(updated._id),
        status: updated.status,
        dueAt: updated.dueAt,
        type: updated.type,
        priority: updated.priority,
        notes: updated.notes ?? null,
        completedAt: updated.completedAt ?? null,
      },
    });
  },
});

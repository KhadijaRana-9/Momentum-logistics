import { collection } from '../../_lib/db.ts';
import { COLLECTIONS, type LeadDoc } from '../../_lib/models.ts';
import { json, notFound, route } from '../../_lib/http.ts';
import { requirePermission } from '../../_lib/auth.ts';
import { objectIdParam } from '../../_lib/params.ts';
import { validate } from '../../_lib/validation.ts';
import { logActivity } from '../../_lib/activity.ts';
import { writeAudit } from '../../_lib/audit.ts';

export default route({
  POST: async (req, res) => {
    const session = await requirePermission(req, 'leads:edit');
    const id = objectIdParam(req);

    const body = validate<{ note: string }>(
      { note: { type: 'string', required: true, min: 1, max: 4000 } },
      req.body,
    );

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
  },
});

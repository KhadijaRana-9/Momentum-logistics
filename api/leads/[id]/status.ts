import { collection } from '../../_lib/db.ts';
import {
  COLLECTIONS,
  LEAD_STATUSES,
  type ActivityType,
  type LeadDoc,
  type LeadStatus,
} from '../../_lib/models.ts';
import { badRequest, json, notFound, route } from '../../_lib/http.ts';
import { requirePermission } from '../../_lib/auth.ts';
import { objectIdParam } from '../../_lib/params.ts';
import { validate } from '../../_lib/validation.ts';
import { serializeLead } from '../../_lib/leadService.ts';
import { logActivity } from '../../_lib/activity.ts';
import { writeAudit } from '../../_lib/audit.ts';

// Allowed forward/backward transitions. "Lost" is reachable from any open stage.
const PIPELINE: LeadStatus[] = [...LEAD_STATUSES];

const STATUS_ACTIVITY: Partial<Record<LeadStatus, ActivityType>> = {
  'Demo Scheduled': 'demo_scheduled',
  'Demo Completed': 'demo_completed',
  'Proposal Sent': 'proposal_sent',
  Won: 'lead_won',
  Lost: 'lead_lost',
};

export default route({
  POST: async (req, res) => {
    const session = await requirePermission(req, 'leads:edit');
    const id = objectIdParam(req);

    const body = validate<{ status: string; reason?: string }>(
      {
        status: { type: 'enum', values: LEAD_STATUSES, required: true },
        reason: { type: 'string', max: 500 },
      },
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

    // Guard nonsensical jumps: can't move a closed lead without reopening to an earlier stage.
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
  },
});

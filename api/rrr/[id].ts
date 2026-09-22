import { ObjectId } from 'mongodb';
import { collection } from '../_lib/db.js';
import { COLLECTIONS, RRR_PRIORITIES, RRR_STATUSES, type RrrDoc, type RrrStatus } from '../_lib/models.js';
import { badRequest, forbidden, json, notFound, route } from '../_lib/http.js';
import { requireAuth, requirePermission } from '../_lib/auth.js';
import { objectIdParam, stringParam } from '../_lib/params.js';
import { validate } from '../_lib/validation.js';
import { diffFields, writeAudit } from '../_lib/audit.js';
import { raiseAlert } from '../_lib/alerts.js';
import { serializeRrr } from './index.js';

const TERMINAL: RrrStatus[] = ['Completed', 'Rejected'];
const EDITABLE_STATUSES: RrrStatus[] = ['Draft', 'Submitted'];

export default route({
  GET: async (req, res) => {
    await requirePermission(req, 'rrr:view');
    const id = objectIdParam(req);
    const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
    const rrr = await rrrs.findOne({ _id: id });
    if (!rrr) throw notFound('RRR not found');
    json(res, 200, { rrr: serializeRrr(rrr) });
  },

  PATCH: async (req, res) => {
    const session = await requirePermission(req, 'rrr:edit');
    const id = objectIdParam(req);

    const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
    const current = await rrrs.findOne({ _id: id });
    if (!current) throw notFound('RRR not found');
    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw badRequest(`RRR is ${current.status} and can no longer be edited`);
    }

    const body = validate<Record<string, unknown>>(
      {
        department: { type: 'string', max: 80 },
        vehicleType: { type: 'string', max: 60 },
        driverRequired: { type: 'boolean' },
        numberOfVehicles: { type: 'number', min: 1, max: 50 },
        pickup: { type: 'string', max: 200 },
        destination: { type: 'string', max: 200 },
        route: { type: 'string', max: 200 },
        loadingInfo: { type: 'string', max: 2000 },
        unloadingInfo: { type: 'string', max: 2000 },
        requiredDate: { type: 'string', max: 40 },
        priority: { type: 'enum', values: RRR_PRIORITIES },
        specialInstructions: { type: 'string', max: 2000 },
        contractRef: { type: 'string', max: 80 },
      },
      req.body,
    );

    const set: Partial<RrrDoc> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if (key === 'requiredDate') {
        const d = new Date(String(value));
        if (Number.isNaN(d.getTime())) throw badRequest('Invalid requiredDate');
        set.requiredDate = d;
      } else {
        (set as Record<string, unknown>)[key] = value;
      }
    }

    const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
    if (changes.length === 0) {
      json(res, 200, { rrr: serializeRrr(current) });
      return;
    }

    await rrrs.updateOne({ _id: id }, { $set: set });
    await writeAudit({ actor: session, action: 'rrr.updated', entity: 'rrr', entityId: current.ref, changes, req });

    const updated = (await rrrs.findOne({ _id: id }))!;
    json(res, 200, { rrr: serializeRrr(updated) });
  },

  POST: async (req, res) => {
    const action = stringParam(req, 'action');
    if (action !== 'status') throw notFound('Unknown action');

    const session = await requireAuth(req);
    const id = objectIdParam(req);

    const body = validate<{ status: string; reason?: string }>(
      { status: { type: 'enum', values: RRR_STATUSES, required: true }, reason: { type: 'string', max: 500 } },
      req.body,
    );
    const next = body.status as RrrStatus;

    // Self-submitting a draft only needs rrr:edit; every other transition
    // (approve/reject/advance) is an approval-authority action.
    const needed = next === 'Submitted' ? 'rrr:edit' : 'rrr:approve';
    if (!session.permissions.includes(needed)) {
      throw forbidden(`Missing permission: ${needed}`);
    }

    const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
    const current = await rrrs.findOne({ _id: id });
    if (!current) throw notFound('RRR not found');
    if (TERMINAL.includes(current.status)) {
      throw badRequest(`RRR is ${current.status} and cannot be changed further`);
    }
    if (current.status === next) {
      json(res, 200, { rrr: serializeRrr(current) });
      return;
    }
    if (next === 'Rejected' && !body.reason) throw badRequest('A reason is required when rejecting an RRR');

    const set: Partial<RrrDoc> = { status: next, updatedAt: new Date() };
    if (next === 'Approved') {
      set.approvedBy = new ObjectId(session.id);
      set.approvedByName = session.name;
    }
    if (next === 'Rejected') set.rejectionReason = body.reason;

    await rrrs.updateOne({ _id: id }, { $set: set });
    await writeAudit({
      actor: session,
      action: `rrr.${next.toLowerCase().replace(/\s+/g, '_')}`,
      entity: 'rrr',
      entityId: current.ref,
      changes: [{ field: 'status', from: current.status, to: next }],
      meta: body.reason ? { reason: body.reason } : undefined,
      req,
    });

    if (next === 'Submitted') {
      await raiseAlert({
        severity: current.priority === 'Urgent' ? 'High' : 'Medium', module: 'RRR', title: `${current.ref} submitted for approval`,
        description: `${current.customerName} — ${current.pickup} → ${current.destination}`, entityType: 'rrr', entityRef: current.ref,
        visibleToPermission: 'rrr:approve',
      });
    } else if (next === 'Approved') {
      await raiseAlert({
        severity: 'Medium', module: 'RRR', title: `${current.ref} approved`,
        description: `${current.pickup} → ${current.destination} — ready to create a Job`, entityType: 'rrr', entityRef: current.ref,
        recipientId: current.requestedBy,
      });
    } else if (next === 'Rejected') {
      await raiseAlert({
        severity: 'High', module: 'RRR', title: `${current.ref} rejected`,
        description: body.reason, entityType: 'rrr', entityRef: current.ref,
        recipientId: current.requestedBy,
      });
    }

    const updated = (await rrrs.findOne({ _id: id }))!;
    json(res, 200, { rrr: serializeRrr(updated) });
  },
});

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../_lib/db.js';
import {
  COLLECTIONS,
  RRR_PRIORITIES,
  RRR_STATUSES,
  type CustomerDoc,
  type RrrDoc,
} from '../_lib/models.js';
import { badRequest, json, route } from '../_lib/http.js';
import { requirePermission } from '../_lib/auth.js';
import { validate } from '../_lib/validation.js';
import { csvParam, intParam, stringParam } from '../_lib/params.js';
import { nextRef } from '../_lib/ids.js';
import { writeAudit } from '../_lib/audit.js';

/**
 * RRR = Requisition Request — the transport request that starts the existing
 * Operations pipeline (RRR -> Job -> Dispatch -> Trip). This endpoint covers
 * the RRR itself; Jobs/Dispatch/Trips/Fleet are still the original UI-only
 * prototype and are not touched here.
 *
 *   GET  /api/rrr                    -> list
 *   GET  /api/rrr?resource=customers -> customer picker (folded in here —
 *                                        the project is at Vercel's 12-function limit)
 *   POST /api/rrr                    -> create (status: Draft or Submitted)
 */
export function serializeRrr(r: RrrDoc) {
  return {
    id: String(r._id),
    ref: r.ref,
    customerId: String(r.customerId),
    customerName: r.customerName,
    department: r.department ?? null,
    vehicleType: r.vehicleType,
    driverRequired: r.driverRequired,
    numberOfVehicles: r.numberOfVehicles,
    pickup: r.pickup,
    destination: r.destination,
    route: r.route ?? null,
    loadingInfo: r.loadingInfo ?? null,
    unloadingInfo: r.unloadingInfo ?? null,
    requiredDate: r.requiredDate,
    priority: r.priority,
    specialInstructions: r.specialInstructions ?? null,
    contractRef: r.contractRef ?? null,
    status: r.status,
    assignedVehicleRef: r.assignedVehicleRef ?? null,
    assignedDriverRef: r.assignedDriverRef ?? null,
    jobRef: r.jobRef ?? null,
    requestedBy: String(r.requestedBy),
    requestedByName: r.requestedByName,
    approvedByName: r.approvedByName ?? null,
    rejectionReason: r.rejectionReason ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export default route({
  GET: async (req, res) => {
    if (stringParam(req, 'resource') === 'customers') return listCustomers(req, res);
    return listRrrs(req, res);
  },
  POST: async (req, res) => {
    if (stringParam(req, 'resource') === 'customer') return createCustomer(req, res);

    const session = await requirePermission(req, 'rrr:create');

    const body = validate<Record<string, string>>(
      {
        mode: { type: 'enum', values: ['draft', 'submit'], default: 'submit' },
        customerId: { type: 'string', required: true, max: 40 },
        department: { type: 'string', max: 80 },
        vehicleType: { type: 'string', required: true, max: 60 },
        driverRequired: { type: 'boolean', default: true },
        numberOfVehicles: { type: 'number', min: 1, max: 50, default: 1 },
        pickup: { type: 'string', required: true, max: 200 },
        destination: { type: 'string', required: true, max: 200 },
        route: { type: 'string', max: 200 },
        loadingInfo: { type: 'string', max: 2000 },
        unloadingInfo: { type: 'string', max: 2000 },
        requiredDate: { type: 'string', required: true, max: 40 },
        priority: { type: 'enum', values: RRR_PRIORITIES, default: 'Medium' },
        specialInstructions: { type: 'string', max: 2000 },
        contractRef: { type: 'string', max: 80 },
      },
      req.body,
    );

    if (!ObjectId.isValid(body.customerId)) throw badRequest('Invalid customerId');
    const requiredDate = new Date(body.requiredDate);
    if (Number.isNaN(requiredDate.getTime())) throw badRequest('Invalid requiredDate');

    const customers = await collection<CustomerDoc>(COLLECTIONS.customers);
    const customer = await customers.findOne({ _id: new ObjectId(body.customerId) });
    if (!customer) throw badRequest('Customer not found');

    const now = new Date();
    const ref = await nextRef('rrr', 'RRR');
    const doc: RrrDoc = {
      ref,
      customerId: customer._id!,
      customerName: customer.name,
      department: body.department,
      vehicleType: body.vehicleType,
      driverRequired: body.driverRequired as unknown as boolean,
      numberOfVehicles: body.numberOfVehicles as unknown as number,
      pickup: body.pickup,
      destination: body.destination,
      route: body.route,
      loadingInfo: body.loadingInfo,
      unloadingInfo: body.unloadingInfo,
      requiredDate,
      priority: body.priority as RrrDoc['priority'],
      specialInstructions: body.specialInstructions,
      contractRef: body.contractRef,
      status: body.mode === 'draft' ? 'Draft' : 'Submitted',
      requestedBy: new ObjectId(session.id),
      requestedByName: session.name,
      createdAt: now,
      updatedAt: now,
    };

    const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
    const result = await rrrs.insertOne(doc);

    await writeAudit({
      actor: session,
      action: doc.status === 'Draft' ? 'rrr.saved_draft' : 'rrr.submitted',
      entity: 'rrr',
      entityId: ref,
      meta: { customer: customer.name, pickup: doc.pickup, destination: doc.destination },
      req,
    });

    json(res, 201, { rrr: serializeRrr({ ...doc, _id: result.insertedId }) });
  },
});

async function listRrrs(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'rrr:view');

  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 100 });
  const search = stringParam(req, 'q')?.trim();

  const filter: Filter<RrrDoc> = {};
  const statuses = csvParam(req, 'status').filter((s) => (RRR_STATUSES as readonly string[]).includes(s));
  if (statuses.length) filter.status = { $in: statuses as RrrDoc['status'][] };

  const priorities = csvParam(req, 'priority').filter((p) => (RRR_PRIORITIES as readonly string[]).includes(p));
  if (priorities.length) filter.priority = { $in: priorities as RrrDoc['priority'][] };

  const customerId = stringParam(req, 'customerId');
  if (customerId && ObjectId.isValid(customerId)) filter.customerId = new ObjectId(customerId);

  if (search) {
    filter.$or = [
      { ref: { $regex: escapeRegex(search), $options: 'i' } },
      { customerName: { $regex: escapeRegex(search), $options: 'i' } },
      { pickup: { $regex: escapeRegex(search), $options: 'i' } },
      { destination: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
  const [items, total] = await Promise.all([
    rrrs.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    rrrs.countDocuments(filter),
  ]);

  json(res, 200, { items: items.map(serializeRrr), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

async function listCustomers(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'rrr:view');
  const customers = await collection<CustomerDoc>(COLLECTIONS.customers);
  const items = await customers.find({}).sort({ name: 1 }).limit(500).toArray();
  json(res, 200, {
    items: items.map((c) => ({
      id: String(c._id),
      name: c.name,
      industry: c.industry ?? null,
      city: c.city ?? null,
      contactName: c.contactName ?? null,
      contractType: c.contractType ?? null,
    })),
  });
}

async function createCustomer(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'rrr:create');

  const body = validate<Record<string, string>>(
    {
      name: { type: 'string', required: true, min: 2, max: 120 },
      industry: { type: 'string', max: 80 },
      city: { type: 'string', max: 80 },
      contactName: { type: 'string', max: 80 },
      contactPhone: { type: 'phone', max: 40 },
      contactEmail: { type: 'email' },
      contractType: { type: 'enum', values: ['Contract', 'Spot', 'Rate Card'], default: 'Spot' },
    },
    req.body,
  );

  const now = new Date();
  const doc: CustomerDoc = {
    name: body.name,
    industry: body.industry,
    city: body.city,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    contactEmail: body.contactEmail,
    contractType: body.contractType as CustomerDoc['contractType'],
    createdAt: now,
    updatedAt: now,
  };
  const customers = await collection<CustomerDoc>(COLLECTIONS.customers);
  const result = await customers.insertOne(doc);
  await writeAudit({ actor: session, action: 'customer.created', entity: 'customer', entityId: String(result.insertedId), req });

  json(res, 201, { customer: { id: String(result.insertedId), name: doc.name, industry: doc.industry ?? null, city: doc.city ?? null, contactName: doc.contactName ?? null, contractType: doc.contractType ?? null } });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

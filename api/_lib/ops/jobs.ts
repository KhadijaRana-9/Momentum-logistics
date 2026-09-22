import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import {
  COLLECTIONS, JOB_STATUSES, BILLING_STATUSES,
  type JobDoc, type RrrDoc, type VehicleDoc, type DriverDoc,
} from '../models.js';
import { badRequest, conflict, json, notFound } from '../http.js';
import { requirePermission } from '../auth.js';
import { validate } from '../validation.js';
import { csvParam, intParam, stringParam } from '../params.js';
import { nextRef } from '../ids.js';
import { writeAudit, diffFields } from '../audit.js';
import { raiseAlert } from '../alerts.js';

export function serializeJob(j: JobDoc) {
  return {
    id: String(j._id),
    ref: j.ref,
    rrrId: String(j.rrrId),
    rrrRef: j.rrrRef,
    customerId: String(j.customerId),
    customerName: j.customerName,
    pickup: j.pickup,
    destination: j.destination,
    route: j.route ?? null,
    loadingInfo: j.loadingInfo ?? null,
    unloadingInfo: j.unloadingInfo ?? null,
    vehicleType: j.vehicleType,
    vehicleId: j.vehicleId ? String(j.vehicleId) : null,
    vehicleRef: j.vehicleRef ?? null,
    driverId: j.driverId ? String(j.driverId) : null,
    driverName: j.driverName ?? null,
    scheduledDate: j.scheduledDate,
    status: j.status,
    tripId: j.tripId ? String(j.tripId) : null,
    tripRef: j.tripRef ?? null,
    revenue: j.revenue,
    billingStatus: j.billingStatus,
    notes: j.notes ?? null,
    createdByName: j.createdByName,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

export async function listJobs(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'jobs:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const search = stringParam(req, 'q')?.trim();

  const filter: Filter<JobDoc> = {};
  const statuses = csvParam(req, 'status').filter((s) => (JOB_STATUSES as readonly string[]).includes(s));
  if (statuses.length) filter.status = { $in: statuses as JobDoc['status'][] };
  const customerId = stringParam(req, 'customerId');
  if (customerId && ObjectId.isValid(customerId)) filter.customerId = new ObjectId(customerId);
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ ref: rx }, { customerName: rx }, { pickup: rx }, { destination: rx }, { rrrRef: rx }];
  }

  const col = await collection<JobDoc>(COLLECTIONS.jobs);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeJob), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

/** Creates a Job from an Approved RRR — the only way a Job can come into existence. */
export async function createJob(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'jobs:manage');
  const body = validate<{ rrrId: string; scheduledDate?: string; revenue?: number }>(
    { rrrId: { type: 'string', required: true, max: 40 }, scheduledDate: { type: 'string', max: 40 }, revenue: { type: 'number', min: 0 } },
    req.body,
  );
  if (!ObjectId.isValid(body.rrrId)) throw badRequest('Invalid rrrId');

  const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
  const rrr = await rrrs.findOne({ _id: new ObjectId(body.rrrId) });
  if (!rrr) throw notFound('RRR not found');
  if (rrr.status !== 'Approved') throw badRequest(`RRR must be Approved before a Job can be created (current status: ${rrr.status})`);
  if (rrr.jobRef) throw conflict(`A job already exists for this RRR (${rrr.jobRef})`);

  const now = new Date();
  const ref = await nextRef('job', 'JOB');
  const doc: JobDoc = {
    ref,
    rrrId: rrr._id!,
    rrrRef: rrr.ref,
    customerId: rrr.customerId,
    customerName: rrr.customerName,
    pickup: rrr.pickup,
    destination: rrr.destination,
    route: rrr.route,
    loadingInfo: rrr.loadingInfo,
    unloadingInfo: rrr.unloadingInfo,
    vehicleType: rrr.vehicleType,
    vehicleId: null,
    vehicleRef: null,
    driverId: null,
    driverName: null,
    scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : rrr.requiredDate,
    status: 'Created',
    tripId: null,
    tripRef: null,
    revenue: body.revenue ?? 0,
    billingStatus: 'Not Billed',
    createdBy: new ObjectId(session.id),
    createdByName: session.name,
    createdAt: now,
    updatedAt: now,
  };
  const jobs = await collection<JobDoc>(COLLECTIONS.jobs);
  const result = await jobs.insertOne(doc);

  await rrrs.updateOne({ _id: rrr._id }, { $set: { status: 'Job Created', jobRef: ref, updatedAt: now } });

  await writeAudit({ actor: session, action: 'job.created', entity: 'job', entityId: ref, meta: { fromRrr: rrr.ref }, req });
  await writeAudit({ actor: session, action: 'rrr.job_created', entity: 'rrr', entityId: rrr.ref, changes: [{ field: 'status', from: rrr.status, to: 'Job Created' }], meta: { job: ref }, req });
  await raiseAlert({
    severity: 'Medium', module: 'Jobs', title: `Job ${ref} created`,
    description: `From ${rrr.ref} — ${rrr.pickup} → ${rrr.destination}`, entityType: 'job', entityRef: ref,
    visibleToPermission: 'jobs:view',
  });

  json(res, 201, { job: serializeJob({ ...doc, _id: result.insertedId }) });
}

export async function getJob(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'jobs:view');
  const col = await collection<JobDoc>(COLLECTIONS.jobs);
  const j = await col.findOne({ _id: id });
  if (!j) throw notFound('Job not found');
  json(res, 200, { job: serializeJob(j) });
}

const EDITABLE_STATUSES: JobDoc['status'][] = ['Created', 'Assigned'];

/** PATCH: assign vehicle/driver, or edit scheduling/notes/revenue/billing. */
export async function updateJob(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'jobs:manage');
  const jobs = await collection<JobDoc>(COLLECTIONS.jobs);
  const current = await jobs.findOne({ _id: id });
  if (!current) throw notFound('Job not found');
  if (current.status === 'Completed') throw badRequest('This job is Completed and can no longer be edited');

  const body = validate<Record<string, unknown>>(
    {
      vehicleId: { type: 'string', max: 40 },
      driverId: { type: 'string', max: 40 },
      scheduledDate: { type: 'string', max: 40 },
      revenue: { type: 'number', min: 0 },
      billingStatus: { type: 'enum', values: BILLING_STATUSES },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );

  const set: Partial<JobDoc> = { updatedAt: new Date() };
  const vehicles = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const drivers = await collection<DriverDoc>(COLLECTIONS.drivers);

  const assigningVehicle = typeof body.vehicleId === 'string';
  const assigningDriver = typeof body.driverId === 'string';

  if (assigningVehicle || assigningDriver) {
    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw badRequest(`Job is ${current.status} — vehicle/driver assignment only happens while it is Created or Assigned`);
    }
  }

  let vehicle: VehicleDoc | null = null;
  if (assigningVehicle) {
    if (!ObjectId.isValid(body.vehicleId as string)) throw badRequest('Invalid vehicleId');
    vehicle = await vehicles.findOne({ _id: new ObjectId(body.vehicleId as string) });
    if (!vehicle) throw notFound('Vehicle not found');
    if (vehicle.status !== 'Available' && String(vehicle._id) !== String(current.vehicleId ?? '')) {
      throw conflict(`Vehicle ${vehicle.unitNumber} is not available (currently ${vehicle.status})`);
    }
    set.vehicleId = vehicle._id;
    set.vehicleRef = vehicle.unitNumber;
  }

  let driver: DriverDoc | null = null;
  if (assigningDriver) {
    if (!ObjectId.isValid(body.driverId as string)) throw badRequest('Invalid driverId');
    driver = await drivers.findOne({ _id: new ObjectId(body.driverId as string) });
    if (!driver) throw notFound('Driver not found');
    if (driver.status !== 'Active' && String(driver._id) !== String(current.driverId ?? '')) {
      throw conflict(`Driver ${driver.name} is not available (currently ${driver.status})`);
    }
    set.driverId = driver._id;
    set.driverName = driver.name;
  }

  if (body.scheduledDate) {
    const d = new Date(body.scheduledDate as string);
    if (Number.isNaN(d.getTime())) throw badRequest('Invalid scheduledDate');
    set.scheduledDate = d;
  }
  if (body.revenue !== undefined) set.revenue = body.revenue as number;
  if (body.billingStatus) set.billingStatus = body.billingStatus as JobDoc['billingStatus'];
  if (body.notes !== undefined) set.notes = body.notes as string;

  // Auto-advance Created -> Assigned once both a vehicle and a driver are on the job.
  const finalVehicleId = set.vehicleId ?? current.vehicleId;
  const finalDriverId = set.driverId ?? current.driverId;
  if (current.status === 'Created' && finalVehicleId && finalDriverId) {
    set.status = 'Assigned';
  }

  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await jobs.updateOne({ _id: id }, { $set: set });

  // Reserve the vehicle/driver so they can't be double-booked onto another job.
  if (vehicle) await vehicles.updateOne({ _id: vehicle._id }, { $set: { status: 'On Trip', driverId: finalDriverId ?? null, driverName: set.driverName ?? current.driverName ?? null, updatedAt: new Date() } });
  if (driver) await drivers.updateOne({ _id: driver._id }, { $set: { status: 'On Trip', assignedVehicleId: finalVehicleId ?? null, assignedVehicleRef: set.vehicleRef ?? current.vehicleRef ?? null, updatedAt: new Date() } });

  if (changes.length) await writeAudit({ actor: session, action: 'job.updated', entity: 'job', entityId: current.ref, changes, req });
  if (set.status === 'Assigned') {
    await raiseAlert({
      severity: 'Low', module: 'Jobs', title: `Job ${current.ref} assigned`,
      description: `${set.vehicleRef ?? current.vehicleRef} / ${set.driverName ?? current.driverName}`,
      entityType: 'job', entityRef: current.ref, visibleToPermission: 'jobs:view',
    });
  }

  const updated = (await jobs.findOne({ _id: id }))!;
  json(res, 200, { job: serializeJob(updated) });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

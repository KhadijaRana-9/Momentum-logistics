import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import {
  COLLECTIONS, TRIP_STATUSES,
  type TripDoc, type JobDoc, type VehicleDoc, type DriverDoc, type RrrDoc,
} from '../models.js';
import { badRequest, json, notFound } from '../http.js';
import { requirePermission } from '../auth.js';
import { validate } from '../validation.js';
import { csvParam, intParam, stringParam } from '../params.js';
import { nextRef } from '../ids.js';
import { writeAudit } from '../audit.js';
import { raiseAlert } from '../alerts.js';

export function serializeTrip(t: TripDoc) {
  return {
    id: String(t._id),
    ref: t.ref,
    jobId: String(t.jobId),
    jobRef: t.jobRef,
    rrrId: String(t.rrrId),
    rrrRef: t.rrrRef,
    customerId: String(t.customerId),
    customerName: t.customerName,
    vehicleId: String(t.vehicleId),
    vehicleRef: t.vehicleRef,
    driverId: String(t.driverId),
    driverName: t.driverName,
    route: t.route,
    startLocation: t.startLocation ?? null,
    endLocation: t.endLocation ?? null,
    startTime: t.startTime,
    endTime: t.endTime ?? null,
    startOdometer: t.startOdometer ?? null,
    endOdometer: t.endOdometer ?? null,
    distanceKm: t.startOdometer != null && t.endOdometer != null ? Math.max(0, t.endOdometer - t.startOdometer) : null,
    status: t.status,
    notes: t.notes ?? null,
    createdByName: t.createdByName,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function listTrips(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'trips:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const search = stringParam(req, 'q')?.trim();

  const filter: Filter<TripDoc> = {};
  const statuses = csvParam(req, 'status').filter((s) => (TRIP_STATUSES as readonly string[]).includes(s));
  if (statuses.length) filter.status = { $in: statuses as TripDoc['status'][] };
  const vehicleId = stringParam(req, 'vehicleId');
  if (vehicleId && ObjectId.isValid(vehicleId)) filter.vehicleId = new ObjectId(vehicleId);
  const driverId = stringParam(req, 'driverId');
  if (driverId && ObjectId.isValid(driverId)) filter.driverId = new ObjectId(driverId);
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ ref: rx }, { route: rx }, { jobRef: rx }, { customerName: rx }];
  }

  const col = await collection<TripDoc>(COLLECTIONS.trips);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeTrip), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

/** Creating a Trip *is* the "dispatch" action — a Job must be Assigned (vehicle+driver set) first. */
export async function createTrip(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'dispatch:manage');
  const body = validate<{ jobId: string; startLocation?: string; startOdometer?: number }>(
    { jobId: { type: 'string', required: true, max: 40 }, startLocation: { type: 'string', max: 200 }, startOdometer: { type: 'number', min: 0 } },
    req.body,
  );
  if (!ObjectId.isValid(body.jobId)) throw badRequest('Invalid jobId');

  const jobs = await collection<JobDoc>(COLLECTIONS.jobs);
  const job = await jobs.findOne({ _id: new ObjectId(body.jobId) });
  if (!job) throw notFound('Job not found');
  if (job.status !== 'Assigned') throw badRequest(`Job must be Assigned (vehicle + driver set) before it can be dispatched (current status: ${job.status})`);
  if (!job.vehicleId || !job.driverId) throw badRequest('Job is missing a vehicle or driver assignment');
  if (job.tripId) throw badRequest(`A trip already exists for this job (${job.tripRef})`);

  const now = new Date();
  const ref = await nextRef('trip', 'TRP');
  const doc: TripDoc = {
    ref,
    jobId: job._id!,
    jobRef: job.ref,
    rrrId: job.rrrId,
    rrrRef: job.rrrRef,
    customerId: job.customerId,
    customerName: job.customerName,
    vehicleId: job.vehicleId,
    vehicleRef: job.vehicleRef!,
    driverId: job.driverId,
    driverName: job.driverName!,
    route: job.route ?? `${job.pickup} → ${job.destination}`,
    startLocation: body.startLocation ?? job.pickup,
    endLocation: job.destination,
    startTime: now,
    endTime: null,
    startOdometer: body.startOdometer ?? null,
    endOdometer: null,
    status: 'Dispatched',
    createdBy: new ObjectId(session.id),
    createdByName: session.name,
    createdAt: now,
    updatedAt: now,
  };
  const trips = await collection<TripDoc>(COLLECTIONS.trips);
  const result = await trips.insertOne(doc);

  await jobs.updateOne({ _id: job._id }, { $set: { status: 'Dispatched', tripId: result.insertedId, tripRef: ref, updatedAt: now } });
  const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
  await rrrs.updateOne({ _id: job.rrrId }, { $set: { status: 'Dispatched', updatedAt: now } });

  await writeAudit({ actor: session, action: 'trip.dispatched', entity: 'trip', entityId: ref, meta: { job: job.ref, vehicle: job.vehicleRef, driver: job.driverName }, req });
  await raiseAlert({
    severity: 'Medium', module: 'Dispatch', title: `Trip ${ref} dispatched`,
    description: `${job.vehicleRef} / ${job.driverName} — ${doc.route}`, entityType: 'trip', entityRef: ref,
    visibleToPermission: 'dispatch:view',
  });

  json(res, 201, { trip: serializeTrip({ ...doc, _id: result.insertedId }) });
}

export async function getTrip(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'trips:view');
  const col = await collection<TripDoc>(COLLECTIONS.trips);
  const t = await col.findOne({ _id: id });
  if (!t) throw notFound('Trip not found');
  json(res, 200, { trip: serializeTrip(t) });
}

const TRIP_ORDER: TripDoc['status'][] = ['Dispatched', 'Started', 'In Transit', 'Delivered', 'Completed'];

export async function updateTripStatus(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'trips:manage');
  const body = validate<{ status: string; endOdometer?: number; endLocation?: string; notes?: string }>(
    {
      status: { type: 'enum', values: TRIP_STATUSES, required: true },
      endOdometer: { type: 'number', min: 0 },
      endLocation: { type: 'string', max: 200 },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );
  const next = body.status as TripDoc['status'];

  const trips = await collection<TripDoc>(COLLECTIONS.trips);
  const current = await trips.findOne({ _id: id });
  if (!current) throw notFound('Trip not found');
  if (current.status === 'Completed') throw badRequest('This trip is Completed and cannot be changed further');

  const curIdx = TRIP_ORDER.indexOf(current.status);
  const nextIdx = TRIP_ORDER.indexOf(next);
  if (nextIdx !== curIdx + 1) {
    throw badRequest(`Invalid transition: ${current.status} → ${next}. Trips must advance one stage at a time (${TRIP_ORDER.join(' → ')})`);
  }
  if ((next === 'Delivered' || next === 'Completed') && body.endOdometer !== undefined && current.startOdometer != null && body.endOdometer < current.startOdometer) {
    throw badRequest('endOdometer cannot be less than the starting odometer reading');
  }

  const now = new Date();
  const set: Partial<TripDoc> = { status: next, updatedAt: now };
  if (body.endOdometer !== undefined) set.endOdometer = body.endOdometer;
  if (body.endLocation) set.endLocation = body.endLocation;
  if (body.notes !== undefined) set.notes = body.notes;
  if (next === 'Completed') set.endTime = now;

  await trips.updateOne({ _id: id }, { $set: set });

  const jobs = await collection<JobDoc>(COLLECTIONS.jobs);
  if (next === 'Started') {
    await jobs.updateOne({ _id: current.jobId }, { $set: { status: 'In Progress', updatedAt: now } });
  }
  if (next === 'Completed') {
    await jobs.updateOne({ _id: current.jobId }, { $set: { status: 'Completed', updatedAt: now } });
    const rrrs = await collection<RrrDoc>(COLLECTIONS.rrrs);
    await rrrs.updateOne({ _id: current.rrrId }, { $set: { status: 'Completed', updatedAt: now } });

    const vehicles = await collection<VehicleDoc>(COLLECTIONS.vehicles);
    // The final odometer reading may have been recorded on an earlier "Delivered" call
    // rather than this one — fall back to the trip's own stored value, and never write
    // odometer: undefined (the Mongo driver serialises that as null, wiping the reading).
    const finalOdometer = set.endOdometer ?? current.endOdometer ?? undefined;
    const vehicleSet: Partial<VehicleDoc> = { status: 'Available', driverId: null, driverName: null, updatedAt: now };
    if (finalOdometer != null) vehicleSet.odometer = finalOdometer;
    await vehicles.updateOne({ _id: current.vehicleId }, { $set: vehicleSet });

    const drivers = await collection<DriverDoc>(COLLECTIONS.drivers);
    await drivers.updateOne({ _id: current.driverId }, { $set: { status: 'Active', assignedVehicleId: null, assignedVehicleRef: null, updatedAt: now } });
  }

  await writeAudit({ actor: session, action: `trip.${next.toLowerCase().replace(/\s+/g, '_')}`, entity: 'trip', entityId: current.ref, changes: [{ field: 'status', from: current.status, to: next }], req });
  if (next === 'Delivered' || next === 'Completed') {
    await raiseAlert({
      severity: next === 'Completed' ? 'Low' : 'Medium', module: 'Trips', title: `Trip ${current.ref} ${next.toLowerCase()}`,
      description: `${current.vehicleRef} / ${current.driverName} — ${current.route}`, entityType: 'trip', entityRef: current.ref,
      visibleToPermission: 'trips:view',
    });
  }

  const updated = (await trips.findOne({ _id: id }))!;
  json(res, 200, { trip: serializeTrip(updated) });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

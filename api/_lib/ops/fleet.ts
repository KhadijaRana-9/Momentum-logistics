import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import { COLLECTIONS, VEHICLE_STATUSES, DRIVER_STATUSES, type VehicleDoc, type DriverDoc } from '../models.js';
import { badRequest, conflict, json, notFound } from '../http.js';
import { requirePermission } from '../auth.js';
import { validate } from '../validation.js';
import { intParam, stringParam } from '../params.js';
import { writeAudit } from '../audit.js';
import { diffFields } from '../audit.js';

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export function serializeVehicle(v: VehicleDoc) {
  return {
    id: String(v._id),
    unitNumber: v.unitNumber,
    registration: v.registration,
    type: v.type,
    make: v.make ?? null,
    model: v.model ?? null,
    year: v.year ?? null,
    homeBranch: v.homeBranch ?? null,
    status: v.status,
    odometer: v.odometer,
    lastServiceDate: v.lastServiceDate ?? null,
    nextServiceDue: v.nextServiceDue ?? null,
    insuranceExpiry: v.insuranceExpiry ?? null,
    registrationExpiry: v.registrationExpiry ?? null,
    driverId: v.driverId ? String(v.driverId) : null,
    driverName: v.driverName ?? null,
    notes: v.notes ?? null,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export async function listVehicles(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'fleet:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const search = stringParam(req, 'q')?.trim();
  const status = stringParam(req, 'status');

  const filter: Filter<VehicleDoc> = {};
  if (status && (VEHICLE_STATUSES as readonly string[]).includes(status)) filter.status = status as VehicleDoc['status'];
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ unitNumber: rx }, { registration: rx }, { type: rx }, { make: rx }, { model: rx }];
  }

  const col = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeVehicle), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function createVehicle(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'fleet:manage');
  const body = validate<Record<string, unknown>>(
    {
      unitNumber: { type: 'string', required: true, max: 40 },
      registration: { type: 'string', required: true, max: 40 },
      type: { type: 'string', required: true, max: 60 },
      make: { type: 'string', max: 60 },
      model: { type: 'string', max: 60 },
      year: { type: 'number', min: 1980, max: 2100 },
      homeBranch: { type: 'string', max: 80 },
      odometer: { type: 'number', min: 0, default: 0 },
      lastServiceDate: { type: 'string', max: 40 },
      nextServiceDue: { type: 'string', max: 40 },
      insuranceExpiry: { type: 'string', max: 40 },
      registrationExpiry: { type: 'string', max: 40 },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );

  const col = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const dupe = await col.findOne({ $or: [{ registration: String(body.registration) }, { unitNumber: String(body.unitNumber) }] });
  if (dupe) throw conflict('A vehicle with this unit number or registration already exists');

  const now = new Date();
  const doc: VehicleDoc = {
    unitNumber: body.unitNumber as string,
    registration: body.registration as string,
    type: body.type as string,
    make: body.make as string | undefined,
    model: body.model as string | undefined,
    year: body.year as number | undefined,
    homeBranch: body.homeBranch as string | undefined,
    status: 'Available',
    odometer: (body.odometer as number) ?? 0,
    lastServiceDate: parseOptionalDate(body.lastServiceDate),
    nextServiceDue: parseOptionalDate(body.nextServiceDue),
    insuranceExpiry: parseOptionalDate(body.insuranceExpiry),
    registrationExpiry: parseOptionalDate(body.registrationExpiry),
    driverId: null,
    driverName: null,
    notes: body.notes as string | undefined,
    createdBy: new ObjectId(session.id),
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'vehicle.created', entity: 'vehicle', entityId: String(result.insertedId), req });
  json(res, 201, { vehicle: serializeVehicle({ ...doc, _id: result.insertedId }) });
}

export async function getVehicle(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'fleet:view');
  const col = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const v = await col.findOne({ _id: id });
  if (!v) throw notFound('Vehicle not found');
  json(res, 200, { vehicle: serializeVehicle(v) });
}

export async function updateVehicle(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'fleet:manage');
  const col = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Vehicle not found');

  const body = validate<Record<string, unknown>>(
    {
      type: { type: 'string', max: 60 },
      make: { type: 'string', max: 60 },
      model: { type: 'string', max: 60 },
      year: { type: 'number', min: 1980, max: 2100 },
      homeBranch: { type: 'string', max: 80 },
      status: { type: 'enum', values: VEHICLE_STATUSES },
      odometer: { type: 'number', min: 0 },
      lastServiceDate: { type: 'string', max: 40 },
      nextServiceDue: { type: 'string', max: 40 },
      insuranceExpiry: { type: 'string', max: 40 },
      registrationExpiry: { type: 'string', max: 40 },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );

  const set: Partial<VehicleDoc> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key.endsWith('Date') || key.endsWith('Expiry') || key === 'nextServiceDue') {
      (set as Record<string, unknown>)[key] = parseOptionalDate(value as string);
    } else {
      (set as Record<string, unknown>)[key] = value;
    }
  }
  // A vehicle cannot be manually forced "Available" while it is actively linked to a driver on a job —
  // that release happens automatically when the trip completes (see trips.ts).
  if (set.status === 'Available' && current.driverId) {
    throw badRequest('This vehicle is still assigned to an active job/driver — it will free up automatically once the trip completes');
  }

  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await col.updateOne({ _id: id }, { $set: set });
  if (changes.length) await writeAudit({ actor: session, action: 'vehicle.updated', entity: 'vehicle', entityId: String(id), changes, req });

  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { vehicle: serializeVehicle(updated) });
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export function serializeDriver(d: DriverDoc) {
  return {
    id: String(d._id),
    name: d.name,
    phone: d.phone ?? null,
    nationality: d.nationality ?? null,
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry ?? null,
    homeBranch: d.homeBranch ?? null,
    status: d.status,
    assignedVehicleId: d.assignedVehicleId ? String(d.assignedVehicleId) : null,
    assignedVehicleRef: d.assignedVehicleRef ?? null,
    joinDate: d.joinDate ?? null,
    notes: d.notes ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function listDrivers(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'fleet:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const search = stringParam(req, 'q')?.trim();
  const status = stringParam(req, 'status');

  const filter: Filter<DriverDoc> = {};
  if (status && (DRIVER_STATUSES as readonly string[]).includes(status)) filter.status = status as DriverDoc['status'];
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { licenseNumber: rx }, { phone: rx }];
  }

  const col = await collection<DriverDoc>(COLLECTIONS.drivers);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeDriver), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function createDriver(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'fleet:manage');
  const body = validate<Record<string, unknown>>(
    {
      name: { type: 'string', required: true, min: 2, max: 100 },
      phone: { type: 'phone', max: 40 },
      nationality: { type: 'string', max: 60 },
      licenseNumber: { type: 'string', required: true, max: 60 },
      licenseExpiry: { type: 'string', max: 40 },
      homeBranch: { type: 'string', max: 80 },
      joinDate: { type: 'string', max: 40 },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );

  const col = await collection<DriverDoc>(COLLECTIONS.drivers);
  const dupe = await col.findOne({ licenseNumber: String(body.licenseNumber) });
  if (dupe) throw conflict('A driver with this license number already exists');

  const now = new Date();
  const doc: DriverDoc = {
    name: body.name as string,
    phone: body.phone as string | undefined,
    nationality: body.nationality as string | undefined,
    licenseNumber: body.licenseNumber as string,
    licenseExpiry: parseOptionalDate(body.licenseExpiry),
    homeBranch: body.homeBranch as string | undefined,
    status: 'Active',
    assignedVehicleId: null,
    assignedVehicleRef: null,
    joinDate: parseOptionalDate(body.joinDate) ?? now,
    notes: body.notes as string | undefined,
    createdBy: new ObjectId(session.id),
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'driver.created', entity: 'driver', entityId: String(result.insertedId), req });
  json(res, 201, { driver: serializeDriver({ ...doc, _id: result.insertedId }) });
}

export async function getDriver(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'fleet:view');
  const col = await collection<DriverDoc>(COLLECTIONS.drivers);
  const d = await col.findOne({ _id: id });
  if (!d) throw notFound('Driver not found');
  json(res, 200, { driver: serializeDriver(d) });
}

export async function updateDriver(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'fleet:manage');
  const col = await collection<DriverDoc>(COLLECTIONS.drivers);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Driver not found');

  const body = validate<Record<string, unknown>>(
    {
      phone: { type: 'phone', max: 40 },
      nationality: { type: 'string', max: 60 },
      licenseExpiry: { type: 'string', max: 40 },
      homeBranch: { type: 'string', max: 80 },
      status: { type: 'enum', values: DRIVER_STATUSES },
      notes: { type: 'string', max: 2000 },
    },
    req.body,
  );

  const set: Partial<DriverDoc> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === 'licenseExpiry') set.licenseExpiry = parseOptionalDate(value as string);
    else (set as Record<string, unknown>)[key] = value;
  }
  if (set.status === 'Active' && current.assignedVehicleId) {
    throw badRequest('This driver is still assigned to an active job/vehicle — it will free up automatically once the trip completes');
  }

  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await col.updateOne({ _id: id }, { $set: set });
  if (changes.length) await writeAudit({ actor: session, action: 'driver.updated', entity: 'driver', entityId: String(id), changes, req });

  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { driver: serializeDriver(updated) });
}

// ---------------------------------------------------------------------------

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw badRequest('Invalid date');
  return d;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

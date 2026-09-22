import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import {
  COLLECTIONS, MAINTENANCE_CATEGORIES, MAINTENANCE_STATUSES, TYRE_STATUSES,
  type WorkshopDoc, type MaintenanceOrderDoc, type PartDoc, type TyreDoc, type VehicleDoc, type MaintenancePartLine,
} from '../models.js';
import { badRequest, conflict, json, notFound } from '../http.js';
import { requirePermission } from '../auth.js';
import { validate } from '../validation.js';
import { intParam, stringParam } from '../params.js';
import { nextRef } from '../ids.js';
import { writeAudit, diffFields } from '../audit.js';
import { raiseAlert } from '../alerts.js';

// ---------------------------------------------------------------------------
// Workshops
// ---------------------------------------------------------------------------

export function serializeWorkshop(w: WorkshopDoc) {
  return {
    id: String(w._id), name: w.name, type: w.type, city: w.city ?? null,
    specialties: w.specialties ?? [], contact: w.contact ?? null,
    createdAt: w.createdAt, updatedAt: w.updatedAt,
  };
}

export async function listWorkshops(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<WorkshopDoc>(COLLECTIONS.workshops);
  const items = await col.find({}).sort({ name: 1 }).limit(200).toArray();
  json(res, 200, { items: items.map(serializeWorkshop), total: items.length });
}

export async function createWorkshop(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'maintenance:manage');
  const body = validate<Record<string, unknown>>(
    {
      name: { type: 'string', required: true, min: 2, max: 120 },
      type: { type: 'enum', values: ['Internal', 'External'], default: 'External' },
      city: { type: 'string', max: 80 },
      specialties: { type: 'stringArray', max: 10 },
      contact: { type: 'phone', max: 40 },
    },
    req.body,
  );
  const now = new Date();
  const doc: WorkshopDoc = {
    name: body.name as string, type: body.type as WorkshopDoc['type'], city: body.city as string | undefined,
    specialties: body.specialties as string[] | undefined, contact: body.contact as string | undefined,
    createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const col = await collection<WorkshopDoc>(COLLECTIONS.workshops);
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'workshop.created', entity: 'workshop', entityId: String(result.insertedId), req });
  json(res, 201, { workshop: serializeWorkshop({ ...doc, _id: result.insertedId }) });
}

export async function getWorkshop(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<WorkshopDoc>(COLLECTIONS.workshops);
  const w = await col.findOne({ _id: id });
  if (!w) throw notFound('Workshop not found');
  json(res, 200, { workshop: serializeWorkshop(w) });
}

// ---------------------------------------------------------------------------
// Maintenance orders (work orders)
// ---------------------------------------------------------------------------

export function serializeMaintenanceOrder(m: MaintenanceOrderDoc) {
  const partsCost = m.parts.reduce((sum, p) => sum + p.cost * p.qty, 0);
  return {
    id: String(m._id), ref: m.ref, vehicleId: String(m.vehicleId), vehicleRef: m.vehicleRef,
    workshopId: String(m.workshopId), workshopName: m.workshopName, category: m.category,
    problem: m.problem, diagnosis: m.diagnosis ?? null, workPerformed: m.workPerformed ?? null,
    parts: m.parts, labourCost: m.labourCost, totalCost: partsCost + m.labourCost,
    startDate: m.startDate, endDate: m.endDate ?? null, warranty: m.warranty ?? null,
    status: m.status, odometer: m.odometer ?? null,
    createdAt: m.createdAt, updatedAt: m.updatedAt,
  };
}

export async function listMaintenanceOrders(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'maintenance:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const filter: Filter<MaintenanceOrderDoc> = {};
  const status = stringParam(req, 'status');
  if (status && (MAINTENANCE_STATUSES as readonly string[]).includes(status)) filter.status = status as MaintenanceOrderDoc['status'];
  const vehicleId = stringParam(req, 'vehicleId');
  if (vehicleId && ObjectId.isValid(vehicleId)) filter.vehicleId = new ObjectId(vehicleId);

  const col = await collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeMaintenanceOrder), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function createMaintenanceOrder(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'maintenance:manage');
  const body = validate<Record<string, unknown>>(
    {
      vehicleId: { type: 'string', required: true, max: 40 },
      workshopId: { type: 'string', required: true, max: 40 },
      category: { type: 'enum', values: MAINTENANCE_CATEGORIES, required: true },
      problem: { type: 'string', required: true, max: 500 },
      diagnosis: { type: 'string', max: 1000 },
      labourCost: { type: 'number', min: 0, default: 0 },
      startDate: { type: 'string', max: 40 },
      warranty: { type: 'string', max: 120 },
      odometer: { type: 'number', min: 0 },
    },
    req.body,
  );
  if (!ObjectId.isValid(body.vehicleId as string)) throw badRequest('Invalid vehicleId');
  if (!ObjectId.isValid(body.workshopId as string)) throw badRequest('Invalid workshopId');

  const vehicles = await collection<VehicleDoc>(COLLECTIONS.vehicles);
  const vehicle = await vehicles.findOne({ _id: new ObjectId(body.vehicleId as string) });
  if (!vehicle) throw notFound('Vehicle not found');
  const workshops = await collection<WorkshopDoc>(COLLECTIONS.workshops);
  const workshop = await workshops.findOne({ _id: new ObjectId(body.workshopId as string) });
  if (!workshop) throw notFound('Workshop not found');

  // Raw part lines may be attached from the request body as a JSON array; validated loosely here.
  const rawParts = Array.isArray((req.body as Record<string, unknown>)?.parts) ? (req.body as { parts: unknown[] }).parts : [];
  const parts: MaintenancePartLine[] = rawParts
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .slice(0, 30)
    .map((p) => ({
      name: String(p.name ?? '').slice(0, 120),
      qty: Math.max(1, Number(p.qty) || 1),
      cost: Math.max(0, Number(p.cost) || 0),
    }))
    .filter((p) => p.name.length > 0);

  const now = new Date();
  const ref = await nextRef('workorder', 'WO');
  const doc: MaintenanceOrderDoc = {
    ref, vehicleId: vehicle._id!, vehicleRef: vehicle.unitNumber, workshopId: workshop._id!, workshopName: workshop.name,
    category: body.category as MaintenanceOrderDoc['category'], problem: body.problem as string, diagnosis: body.diagnosis as string | undefined,
    parts, labourCost: (body.labourCost as number) ?? 0,
    startDate: body.startDate ? new Date(body.startDate as string) : now, endDate: null,
    warranty: body.warranty as string | undefined, status: 'Scheduled', odometer: body.odometer as number | undefined,
    createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const col = await collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders);
  const result = await col.insertOne(doc);

  // A vehicle in for maintenance shouldn't be assignable to a job.
  await vehicles.updateOne({ _id: vehicle._id, status: 'Available' }, { $set: { status: 'Maintenance', updatedAt: now } });

  await writeAudit({ actor: session, action: 'maintenance.created', entity: 'maintenance_order', entityId: ref, meta: { vehicle: vehicle.unitNumber }, req });
  json(res, 201, { maintenanceOrder: serializeMaintenanceOrder({ ...doc, _id: result.insertedId }) });
}

export async function getMaintenanceOrder(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders);
  const m = await col.findOne({ _id: id });
  if (!m) throw notFound('Maintenance order not found');
  json(res, 200, { maintenanceOrder: serializeMaintenanceOrder(m) });
}

export async function updateMaintenanceOrder(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'maintenance:manage');
  const col = await collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Maintenance order not found');
  if (current.status === 'Completed') throw badRequest('This work order is Completed and can no longer be edited');

  const body = validate<Record<string, unknown>>(
    {
      status: { type: 'enum', values: MAINTENANCE_STATUSES },
      workPerformed: { type: 'string', max: 2000 },
      diagnosis: { type: 'string', max: 1000 },
      labourCost: { type: 'number', min: 0 },
      warranty: { type: 'string', max: 120 },
    },
    req.body,
  );
  const set: Partial<MaintenanceOrderDoc> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(body)) if (value !== undefined) (set as Record<string, unknown>)[key] = value;
  if (set.status === 'Completed') set.endDate = new Date();

  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await col.updateOne({ _id: id }, { $set: set });

  if (set.status === 'Completed') {
    const vehicles = await collection<VehicleDoc>(COLLECTIONS.vehicles);
    await vehicles.updateOne({ _id: current.vehicleId, status: 'Maintenance' }, { $set: { status: 'Available', updatedAt: new Date() } });
    await raiseAlert({ severity: 'Low', module: 'Maintenance', title: `Work order ${current.ref} completed`, description: `${current.vehicleRef} back in service`, entityType: 'maintenance_order', entityRef: current.ref, visibleToPermission: 'maintenance:view' });
  }
  if (changes.length) await writeAudit({ actor: session, action: 'maintenance.updated', entity: 'maintenance_order', entityId: current.ref, changes, req });

  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { maintenanceOrder: serializeMaintenanceOrder(updated) });
}

// ---------------------------------------------------------------------------
// Parts inventory
// ---------------------------------------------------------------------------

function partStatus(p: PartDoc): 'Healthy' | 'Low' | 'Critical' | 'Out of Stock' {
  if (p.stock <= 0) return 'Out of Stock';
  if (p.stock < p.minStock * 0.5) return 'Critical';
  if (p.stock < p.minStock) return 'Low';
  return 'Healthy';
}

export function serializePart(p: PartDoc) {
  return {
    id: String(p._id), name: p.name, category: p.category ?? null, sku: p.sku, stock: p.stock,
    minStock: p.minStock, unitCost: p.unitCost, supplier: p.supplier ?? null, status: partStatus(p),
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  };
}

export async function listParts(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<PartDoc>(COLLECTIONS.parts);
  const items = await col.find({}).sort({ name: 1 }).limit(500).toArray();
  json(res, 200, { items: items.map(serializePart), total: items.length });
}

export async function createPart(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'maintenance:manage');
  const body = validate<Record<string, unknown>>(
    {
      name: { type: 'string', required: true, min: 2, max: 150 },
      category: { type: 'string', max: 60 },
      sku: { type: 'string', required: true, max: 60 },
      stock: { type: 'number', min: 0, default: 0 },
      minStock: { type: 'number', min: 0, default: 1 },
      unitCost: { type: 'number', min: 0, required: true },
      supplier: { type: 'string', max: 120 },
    },
    req.body,
  );
  const col = await collection<PartDoc>(COLLECTIONS.parts);
  const dupe = await col.findOne({ sku: String(body.sku) });
  if (dupe) throw conflict('A part with this SKU already exists');
  const now = new Date();
  const doc: PartDoc = {
    name: body.name as string, category: body.category as string | undefined, sku: body.sku as string,
    stock: (body.stock as number) ?? 0, minStock: (body.minStock as number) ?? 1, unitCost: body.unitCost as number,
    supplier: body.supplier as string | undefined, createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'part.created', entity: 'part', entityId: String(result.insertedId), req });
  json(res, 201, { part: serializePart({ ...doc, _id: result.insertedId }) });
}

export async function getPart(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<PartDoc>(COLLECTIONS.parts);
  const p = await col.findOne({ _id: id });
  if (!p) throw notFound('Part not found');
  json(res, 200, { part: serializePart(p) });
}

export async function updatePart(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'maintenance:manage');
  const col = await collection<PartDoc>(COLLECTIONS.parts);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Part not found');
  const body = validate<Record<string, unknown>>(
    { stock: { type: 'number', min: 0 }, minStock: { type: 'number', min: 0 }, unitCost: { type: 'number', min: 0 }, supplier: { type: 'string', max: 120 } },
    req.body,
  );
  const set: Partial<PartDoc> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(body)) if (value !== undefined) (set as Record<string, unknown>)[key] = value;
  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await col.updateOne({ _id: id }, { $set: set });
  if (changes.length) await writeAudit({ actor: session, action: 'part.updated', entity: 'part', entityId: current.sku, changes, req });
  const updated = (await col.findOne({ _id: id }))!;

  if (partStatus(updated) === 'Critical' || partStatus(updated) === 'Out of Stock') {
    await raiseAlert({ severity: partStatus(updated) === 'Out of Stock' ? 'Critical' : 'High', module: 'Maintenance', title: `${updated.name} stock ${partStatus(updated).toLowerCase()}`, description: `${updated.stock} in stock, minimum ${updated.minStock}`, entityType: 'part', entityRef: updated.sku, visibleToPermission: 'maintenance:view' });
  }
  json(res, 200, { part: serializePart(updated) });
}

// ---------------------------------------------------------------------------
// Tyres
// ---------------------------------------------------------------------------

export function serializeTyre(t: TyreDoc) {
  return {
    id: String(t._id), brand: t.brand, size: t.size, serial: t.serial,
    vehicleId: t.vehicleId ? String(t.vehicleId) : null, vehicleRef: t.vehicleRef ?? null, position: t.position ?? null,
    installKm: t.installKm ?? null, removalKm: t.removalKm ?? null, treadDepth: t.treadDepth ?? null,
    cost: t.cost ?? null, status: t.status, replacementReason: t.replacementReason ?? null,
    createdAt: t.createdAt, updatedAt: t.updatedAt,
  };
}

export async function listTyres(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'maintenance:view');
  const filter: Filter<TyreDoc> = {};
  const vehicleId = stringParam(req, 'vehicleId');
  if (vehicleId && ObjectId.isValid(vehicleId)) filter.vehicleId = new ObjectId(vehicleId);
  const col = await collection<TyreDoc>(COLLECTIONS.tyres);
  const items = await col.find(filter).sort({ createdAt: -1 }).limit(500).toArray();
  json(res, 200, { items: items.map(serializeTyre), total: items.length });
}

export async function createTyre(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'maintenance:manage');
  const body = validate<Record<string, unknown>>(
    {
      brand: { type: 'string', required: true, max: 80 },
      size: { type: 'string', required: true, max: 40 },
      serial: { type: 'string', required: true, max: 60 },
      vehicleId: { type: 'string', max: 40 },
      position: { type: 'string', max: 40 },
      installKm: { type: 'number', min: 0 },
      treadDepth: { type: 'number', min: 0, max: 30 },
      cost: { type: 'number', min: 0 },
    },
    req.body,
  );
  const col = await collection<TyreDoc>(COLLECTIONS.tyres);
  const dupe = await col.findOne({ serial: String(body.serial) });
  if (dupe) throw conflict('A tyre with this serial already exists');

  let vehicleRef: string | undefined;
  if (body.vehicleId) {
    if (!ObjectId.isValid(body.vehicleId as string)) throw badRequest('Invalid vehicleId');
    const vehicles = await collection<VehicleDoc>(COLLECTIONS.vehicles);
    const vehicle = await vehicles.findOne({ _id: new ObjectId(body.vehicleId as string) });
    if (!vehicle) throw notFound('Vehicle not found');
    vehicleRef = vehicle.unitNumber;
  }

  const now = new Date();
  const doc: TyreDoc = {
    brand: body.brand as string, size: body.size as string, serial: body.serial as string,
    vehicleId: body.vehicleId ? new ObjectId(body.vehicleId as string) : null, vehicleRef: vehicleRef ?? null,
    position: body.position as string | undefined, installKm: body.installKm as number | undefined,
    removalKm: null, treadDepth: body.treadDepth as number | undefined, cost: body.cost as number | undefined,
    status: body.vehicleId ? 'In Service' : 'In Stock', createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'tyre.created', entity: 'tyre', entityId: String(result.insertedId), req });
  json(res, 201, { tyre: serializeTyre({ ...doc, _id: result.insertedId }) });
}

export async function getTyre(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'maintenance:view');
  const col = await collection<TyreDoc>(COLLECTIONS.tyres);
  const t = await col.findOne({ _id: id });
  if (!t) throw notFound('Tyre not found');
  json(res, 200, { tyre: serializeTyre(t) });
}

export async function updateTyre(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'maintenance:manage');
  const col = await collection<TyreDoc>(COLLECTIONS.tyres);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Tyre not found');
  const body = validate<Record<string, unknown>>(
    { status: { type: 'enum', values: TYRE_STATUSES }, treadDepth: { type: 'number', min: 0, max: 30 }, removalKm: { type: 'number', min: 0 }, replacementReason: { type: 'string', max: 300 } },
    req.body,
  );
  const set: Partial<TyreDoc> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(body)) if (value !== undefined) (set as Record<string, unknown>)[key] = value;
  const changes = diffFields(current as unknown as Record<string, unknown>, set as Record<string, unknown>).filter((c) => c.field !== 'updatedAt');
  await col.updateOne({ _id: id }, { $set: set });
  if (changes.length) await writeAudit({ actor: session, action: 'tyre.updated', entity: 'tyre', entityId: current.serial, changes, req });
  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { tyre: serializeTyre(updated) });
}

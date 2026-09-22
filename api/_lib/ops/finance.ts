import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import {
  COLLECTIONS, EXPENSE_CATEGORIES, EXPENSE_STATUSES, FUEL_TYPES, INVOICE_STATUSES,
  type ExpenseDoc, type FuelVoucherDoc, type InvoiceDoc, type InvoiceCharge,
  type TripDoc, type VehicleDoc, type DriverDoc, type CustomerDoc, type JobDoc,
} from '../models.js';
import { badRequest, json, notFound } from '../http.js';
import { requirePermission } from '../auth.js';
import { validate } from '../validation.js';
import { intParam, stringParam } from '../params.js';
import { nextRef } from '../ids.js';
import { writeAudit } from '../audit.js';
import { raiseAlert } from '../alerts.js';

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export function serializeExpense(e: ExpenseDoc) {
  return {
    id: String(e._id), ref: e.ref, category: e.category,
    tripId: e.tripId ? String(e.tripId) : null, tripRef: e.tripRef ?? null,
    driverId: e.driverId ? String(e.driverId) : null, driverName: e.driverName ?? null,
    vehicleId: e.vehicleId ? String(e.vehicleId) : null, vehicleRef: e.vehicleRef ?? null,
    amount: e.amount, date: e.date, description: e.description ?? null, approvalStatus: e.approvalStatus,
    createdByName: e.createdByName, createdAt: e.createdAt, updatedAt: e.updatedAt,
  };
}

export async function listExpenses(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'finance:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const filter: Filter<ExpenseDoc> = {};
  const status = stringParam(req, 'status');
  if (status && (EXPENSE_STATUSES as readonly string[]).includes(status)) filter.approvalStatus = status as ExpenseDoc['approvalStatus'];
  const tripId = stringParam(req, 'tripId');
  if (tripId && ObjectId.isValid(tripId)) filter.tripId = new ObjectId(tripId);
  const col = await collection<ExpenseDoc>(COLLECTIONS.expenses);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeExpense), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function createExpense(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'finance:manage');
  const body = validate<Record<string, unknown>>(
    {
      category: { type: 'enum', values: EXPENSE_CATEGORIES, required: true },
      tripId: { type: 'string', max: 40 },
      driverId: { type: 'string', max: 40 },
      vehicleId: { type: 'string', max: 40 },
      amount: { type: 'number', min: 0.01, required: true },
      date: { type: 'string', max: 40 },
      description: { type: 'string', max: 500 },
    },
    req.body,
  );

  let tripRef: string | undefined, driverName: string | undefined, vehicleRef: string | undefined;
  if (body.tripId) {
    if (!ObjectId.isValid(body.tripId as string)) throw badRequest('Invalid tripId');
    const trip = await (await collection<TripDoc>(COLLECTIONS.trips)).findOne({ _id: new ObjectId(body.tripId as string) });
    if (!trip) throw notFound('Trip not found');
    tripRef = trip.ref;
  }
  if (body.driverId) {
    if (!ObjectId.isValid(body.driverId as string)) throw badRequest('Invalid driverId');
    const driver = await (await collection<DriverDoc>(COLLECTIONS.drivers)).findOne({ _id: new ObjectId(body.driverId as string) });
    if (!driver) throw notFound('Driver not found');
    driverName = driver.name;
  }
  if (body.vehicleId) {
    if (!ObjectId.isValid(body.vehicleId as string)) throw badRequest('Invalid vehicleId');
    const vehicle = await (await collection<VehicleDoc>(COLLECTIONS.vehicles)).findOne({ _id: new ObjectId(body.vehicleId as string) });
    if (!vehicle) throw notFound('Vehicle not found');
    vehicleRef = vehicle.unitNumber;
  }

  const now = new Date();
  const ref = await nextRef('expense', 'EX');
  const doc: ExpenseDoc = {
    ref, category: body.category as ExpenseDoc['category'],
    tripId: body.tripId ? new ObjectId(body.tripId as string) : null, tripRef: tripRef ?? null,
    driverId: body.driverId ? new ObjectId(body.driverId as string) : null, driverName: driverName ?? null,
    vehicleId: body.vehicleId ? new ObjectId(body.vehicleId as string) : null, vehicleRef: vehicleRef ?? null,
    amount: body.amount as number, date: body.date ? new Date(body.date as string) : now, description: body.description as string | undefined,
    approvalStatus: 'Pending', createdBy: new ObjectId(session.id), createdByName: session.name, createdAt: now, updatedAt: now,
  };
  const col = await collection<ExpenseDoc>(COLLECTIONS.expenses);
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'expense.created', entity: 'expense', entityId: ref, req });
  json(res, 201, { expense: serializeExpense({ ...doc, _id: result.insertedId }) });
}

export async function getExpense(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'finance:view');
  const col = await collection<ExpenseDoc>(COLLECTIONS.expenses);
  const e = await col.findOne({ _id: id });
  if (!e) throw notFound('Expense not found');
  json(res, 200, { expense: serializeExpense(e) });
}

export async function updateExpenseStatus(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'finance:manage');
  const body = validate<{ approvalStatus: string }>({ approvalStatus: { type: 'enum', values: EXPENSE_STATUSES, required: true } }, req.body);
  const col = await collection<ExpenseDoc>(COLLECTIONS.expenses);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Expense not found');
  if (current.approvalStatus === 'Reimbursed') throw badRequest('This expense is already Reimbursed and cannot be changed further');

  const next = body.approvalStatus as ExpenseDoc['approvalStatus'];
  await col.updateOne({ _id: id }, { $set: { approvalStatus: next, updatedAt: new Date() } });
  await writeAudit({ actor: session, action: 'expense.status_changed', entity: 'expense', entityId: current.ref, changes: [{ field: 'approvalStatus', from: current.approvalStatus, to: next }], req });
  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { expense: serializeExpense(updated) });
}

// ---------------------------------------------------------------------------
// Fuel vouchers
// ---------------------------------------------------------------------------

export function serializeFuelVoucher(f: FuelVoucherDoc) {
  return {
    id: String(f._id), ref: f.ref, vehicleId: String(f.vehicleId), vehicleRef: f.vehicleRef,
    driverId: f.driverId ? String(f.driverId) : null, driverName: f.driverName ?? null,
    station: f.station ?? null, date: f.date, odometer: f.odometer ?? null, litres: f.litres, rate: f.rate, total: f.total,
    fuelType: f.fuelType, tripId: f.tripId ? String(f.tripId) : null, tripRef: f.tripRef ?? null,
    createdAt: f.createdAt, updatedAt: f.updatedAt,
  };
}

export async function listFuelVouchers(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'finance:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const filter: Filter<FuelVoucherDoc> = {};
  const vehicleId = stringParam(req, 'vehicleId');
  if (vehicleId && ObjectId.isValid(vehicleId)) filter.vehicleId = new ObjectId(vehicleId);
  const tripId = stringParam(req, 'tripId');
  if (tripId && ObjectId.isValid(tripId)) filter.tripId = new ObjectId(tripId);
  const col = await collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeFuelVoucher), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function createFuelVoucher(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'finance:manage');
  const body = validate<Record<string, unknown>>(
    {
      vehicleId: { type: 'string', required: true, max: 40 },
      driverId: { type: 'string', max: 40 },
      station: { type: 'string', max: 120 },
      date: { type: 'string', max: 40 },
      odometer: { type: 'number', min: 0 },
      litres: { type: 'number', min: 0.1, required: true },
      rate: { type: 'number', min: 0.01, required: true },
      fuelType: { type: 'enum', values: FUEL_TYPES, default: 'Diesel' },
      tripId: { type: 'string', max: 40 },
    },
    req.body,
  );
  if (!ObjectId.isValid(body.vehicleId as string)) throw badRequest('Invalid vehicleId');
  const vehicle = await (await collection<VehicleDoc>(COLLECTIONS.vehicles)).findOne({ _id: new ObjectId(body.vehicleId as string) });
  if (!vehicle) throw notFound('Vehicle not found');

  let driverName: string | undefined, tripRef: string | undefined;
  if (body.driverId) {
    if (!ObjectId.isValid(body.driverId as string)) throw badRequest('Invalid driverId');
    const driver = await (await collection<DriverDoc>(COLLECTIONS.drivers)).findOne({ _id: new ObjectId(body.driverId as string) });
    if (!driver) throw notFound('Driver not found');
    driverName = driver.name;
  }
  if (body.tripId) {
    if (!ObjectId.isValid(body.tripId as string)) throw badRequest('Invalid tripId');
    const trip = await (await collection<TripDoc>(COLLECTIONS.trips)).findOne({ _id: new ObjectId(body.tripId as string) });
    if (!trip) throw notFound('Trip not found');
    tripRef = trip.ref;
  }

  const now = new Date();
  const ref = await nextRef('fuel', 'FV');
  const litres = body.litres as number;
  const rate = body.rate as number;
  const doc: FuelVoucherDoc = {
    ref, vehicleId: vehicle._id!, vehicleRef: vehicle.unitNumber,
    driverId: body.driverId ? new ObjectId(body.driverId as string) : null, driverName: driverName ?? null,
    station: body.station as string | undefined, date: body.date ? new Date(body.date as string) : now,
    odometer: body.odometer as number | undefined, litres, rate, total: Math.round(litres * rate * 100) / 100,
    fuelType: body.fuelType as FuelVoucherDoc['fuelType'],
    tripId: body.tripId ? new ObjectId(body.tripId as string) : null, tripRef: tripRef ?? null,
    createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const col = await collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers);
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'fuel.created', entity: 'fuel_voucher', entityId: ref, req });
  json(res, 201, { fuelVoucher: serializeFuelVoucher({ ...doc, _id: result.insertedId }) });
}

export async function getFuelVoucher(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'finance:view');
  const col = await collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers);
  const f = await col.findOne({ _id: id });
  if (!f) throw notFound('Fuel voucher not found');
  json(res, 200, { fuelVoucher: serializeFuelVoucher(f) });
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

function invoiceTotals(inv: Pick<InvoiceDoc, 'charges' | 'additionalCharges' | 'discount' | 'taxRate'>) {
  const subtotal = inv.charges.reduce((s, c) => s + c.amount, 0) + inv.additionalCharges.reduce((s, c) => s + c.amount, 0);
  const afterDiscount = Math.max(0, subtotal - inv.discount);
  const tax = Math.round(afterDiscount * (inv.taxRate / 100) * 100) / 100;
  return { subtotal, tax, total: Math.round((afterDiscount + tax) * 100) / 100 };
}

export function serializeInvoice(inv: InvoiceDoc) {
  const totals = invoiceTotals(inv);
  return {
    id: String(inv._id), ref: inv.ref, customerId: String(inv.customerId), customerName: inv.customerName,
    contractRef: inv.contractRef ?? null, jobRefs: inv.jobRefs, tripRefs: inv.tripRefs,
    charges: inv.charges, additionalCharges: inv.additionalCharges, discount: inv.discount, taxRate: inv.taxRate,
    subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
    status: inv.status, issueDate: inv.issueDate, dueDate: inv.dueDate,
    createdAt: inv.createdAt, updatedAt: inv.updatedAt,
  };
}

export async function listInvoices(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'finance:view');
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 25, { min: 1, max: 200 });
  const filter: Filter<InvoiceDoc> = {};
  const status = stringParam(req, 'status');
  if (status && (INVOICE_STATUSES as readonly string[]).includes(status)) filter.status = status as InvoiceDoc['status'];
  const customerId = stringParam(req, 'customerId');
  if (customerId && ObjectId.isValid(customerId)) filter.customerId = new ObjectId(customerId);
  const col = await collection<InvoiceDoc>(COLLECTIONS.invoices);
  const [items, total] = await Promise.all([
    col.find(filter).sort({ issueDate: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  json(res, 200, { items: items.map(serializeInvoice), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

function parseCharges(raw: unknown): InvoiceCharge[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .slice(0, 30)
    .map((c) => ({ description: String(c.description ?? '').slice(0, 200), amount: Math.max(0, Number(c.amount) || 0) }))
    .filter((c) => c.description.length > 0);
}

export async function createInvoice(req: VercelRequest, res: VercelResponse) {
  const session = await requirePermission(req, 'finance:manage');
  const body = validate<Record<string, unknown>>(
    {
      customerId: { type: 'string', required: true, max: 40 },
      contractRef: { type: 'string', max: 80 },
      discount: { type: 'number', min: 0, default: 0 },
      taxRate: { type: 'number', min: 0, max: 100, default: 5 },
      dueDate: { type: 'string', max: 40 },
    },
    req.body,
  );
  if (!ObjectId.isValid(body.customerId as string)) throw badRequest('Invalid customerId');
  const customer = await (await collection<CustomerDoc>(COLLECTIONS.customers)).findOne({ _id: new ObjectId(body.customerId as string) });
  if (!customer) throw notFound('Customer not found');

  const raw = req.body as Record<string, unknown>;
  const charges = parseCharges(raw.charges);
  const additionalCharges = parseCharges(raw.additionalCharges);
  if (charges.length === 0) throw badRequest('At least one charge line is required');

  const jobRefsInput: string[] = Array.isArray(raw.jobIds) ? (raw.jobIds as unknown[]).map(String) : [];
  const tripRefsInput: string[] = Array.isArray(raw.tripIds) ? (raw.tripIds as unknown[]).map(String) : [];
  const jobObjIds = jobRefsInput.filter((s) => ObjectId.isValid(s)).map((s) => new ObjectId(s));
  const tripObjIds = tripRefsInput.filter((s) => ObjectId.isValid(s)).map((s) => new ObjectId(s));
  const jobs = jobObjIds.length ? await (await collection<JobDoc>(COLLECTIONS.jobs)).find({ _id: { $in: jobObjIds } }).toArray() : [];
  const trips = tripObjIds.length ? await (await collection<TripDoc>(COLLECTIONS.trips)).find({ _id: { $in: tripObjIds } }).toArray() : [];

  const now = new Date();
  const ref = await nextRef('invoice', 'INV');
  const doc: InvoiceDoc = {
    ref, customerId: customer._id!, customerName: customer.name, contractRef: body.contractRef as string | undefined,
    jobIds: jobs.map((j) => j._id!), jobRefs: jobs.map((j) => j.ref), tripIds: trips.map((t) => t._id!), tripRefs: trips.map((t) => t.ref),
    charges, additionalCharges, discount: (body.discount as number) ?? 0, taxRate: (body.taxRate as number) ?? 5,
    status: 'Draft', issueDate: now, dueDate: body.dueDate ? new Date(body.dueDate as string) : new Date(now.getTime() + 30 * 86400000),
    createdBy: new ObjectId(session.id), createdAt: now, updatedAt: now,
  };
  const col = await collection<InvoiceDoc>(COLLECTIONS.invoices);
  const result = await col.insertOne(doc);
  await writeAudit({ actor: session, action: 'invoice.created', entity: 'invoice', entityId: ref, meta: { customer: customer.name }, req });
  json(res, 201, { invoice: serializeInvoice({ ...doc, _id: result.insertedId }) });
}

export async function getInvoice(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  await requirePermission(req, 'finance:view');
  const col = await collection<InvoiceDoc>(COLLECTIONS.invoices);
  const inv = await col.findOne({ _id: id });
  if (!inv) throw notFound('Invoice not found');
  json(res, 200, { invoice: serializeInvoice(inv) });
}

const INVOICE_ORDER: InvoiceDoc['status'][] = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Paid'];
const INVOICE_SIDE_STATES: InvoiceDoc['status'][] = ['Overdue', 'Disputed'];

export async function updateInvoiceStatus(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requirePermission(req, 'finance:manage');
  const body = validate<{ status: string }>({ status: { type: 'enum', values: INVOICE_STATUSES, required: true } }, req.body);
  const col = await collection<InvoiceDoc>(COLLECTIONS.invoices);
  const current = await col.findOne({ _id: id });
  if (!current) throw notFound('Invoice not found');
  if (current.status === 'Paid') throw badRequest('This invoice is Paid and cannot be changed further');

  const next = body.status as InvoiceDoc['status'];
  const curIdx = INVOICE_ORDER.indexOf(current.status);
  const nextIdx = INVOICE_ORDER.indexOf(next);
  const isForwardStep = curIdx !== -1 && nextIdx === curIdx + 1;
  const isSideState = INVOICE_SIDE_STATES.includes(next);
  if (!isForwardStep && !isSideState) {
    throw badRequest(`Invalid transition: ${current.status} → ${next}`);
  }

  await col.updateOne({ _id: id }, { $set: { status: next, updatedAt: new Date() } });
  await writeAudit({ actor: session, action: 'invoice.status_changed', entity: 'invoice', entityId: current.ref, changes: [{ field: 'status', from: current.status, to: next }], req });
  if (next === 'Pending Approval') {
    await raiseAlert({ severity: 'Low', module: 'Finance', title: `Invoice ${current.ref} pending approval`, description: `${current.customerName}`, entityType: 'invoice', entityRef: current.ref, visibleToPermission: 'finance:manage' });
  }
  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { invoice: serializeInvoice(updated) });
}

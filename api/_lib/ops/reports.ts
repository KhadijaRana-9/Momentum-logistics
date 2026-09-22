import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection } from '../db.js';
import {
  COLLECTIONS,
  type RrrDoc, type JobDoc, type TripDoc, type VehicleDoc, type DriverDoc,
  type ExpenseDoc, type FuelVoucherDoc, type MaintenanceOrderDoc, type InvoiceDoc,
} from '../models.js';
import { json } from '../http.js';
import { requirePermission } from '../auth.js';

/**
 * Every number here comes straight from a MongoDB aggregation over real
 * operational collections at request time — nothing is hardcoded or cached
 * from mock data. If a collection is empty, the number is honestly 0.
 */
export async function getOpsReports(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'analytics:view');

  const [rrrs, jobs, trips, vehicles, drivers, expenses, fuel, maintenance, invoices] = await Promise.all([
    collection<RrrDoc>(COLLECTIONS.rrrs),
    collection<JobDoc>(COLLECTIONS.jobs),
    collection<TripDoc>(COLLECTIONS.trips),
    collection<VehicleDoc>(COLLECTIONS.vehicles),
    collection<DriverDoc>(COLLECTIONS.drivers),
    collection<ExpenseDoc>(COLLECTIONS.expenses),
    collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers),
    collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders),
    collection<InvoiceDoc>(COLLECTIONS.invoices),
  ]);

  const [rrrByStatus, jobByStatus, tripByStatus, vehicleByStatus, driverByStatus] = await Promise.all([
    groupByStatus(rrrs),
    groupByStatus(jobs),
    groupByStatus(trips),
    groupByStatus(vehicles),
    groupByStatus(drivers),
  ]);

  const [tripsPerDriver, revenueAgg, expenseAgg, fuelAgg, maintenanceAgg, invoiceAgg] = await Promise.all([
    trips.aggregate<{ _id: string; driverName: string; count: number }>([
      { $group: { _id: '$driverId', driverName: { $first: '$driverName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray(),
    jobs.aggregate<{ _id: null; total: number }>([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]).toArray(),
    expenses.aggregate<{ _id: null; total: number }>([{ $group: { _id: null, total: { $sum: '$amount' } } }]).toArray(),
    fuel.aggregate<{ _id: null; total: number; litres: number }>([{ $group: { _id: null, total: { $sum: '$total' }, litres: { $sum: '$litres' } } }]).toArray(),
    maintenance.aggregate<{ _id: null; total: number }>([
      { $project: { partsCost: { $sum: '$parts.cost' }, labourCost: 1 } },
      { $group: { _id: null, total: { $sum: { $add: ['$partsCost', '$labourCost'] } } } },
    ]).toArray(),
    invoices.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
  ]);

  const completedTrips = tripByStatus['Completed'] ?? 0;
  const totalVehicles = await vehicles.countDocuments();
  const revenue = revenueAgg[0]?.total ?? 0;
  const expenseTotal = expenseAgg[0]?.total ?? 0;
  const fuelTotal = fuelAgg[0]?.total ?? 0;
  const maintenanceTotal = maintenanceAgg[0]?.total ?? 0;
  const profitLoss = Math.round((revenue - expenseTotal - fuelTotal - maintenanceTotal) * 100) / 100;

  json(res, 200, {
    rrr: { total: await rrrs.countDocuments(), byStatus: rrrByStatus },
    jobs: { total: await jobs.countDocuments(), byStatus: jobByStatus },
    trips: { total: await trips.countDocuments(), byStatus: tripByStatus, completed: completedTrips },
    fleet: { totalVehicles, byStatus: vehicleByStatus, totalDrivers: await drivers.countDocuments(), driversByStatus: driverByStatus },
    driverActivity: tripsPerDriver.filter((d) => d._id).map((d) => ({ driverId: d._id, driverName: d.driverName, trips: d.count })),
    finance: {
      revenue, expenses: expenseTotal, fuel: fuelTotal, maintenance: maintenanceTotal, profitLoss,
      invoicesByStatus: Object.fromEntries(invoiceAgg.map((r) => [r._id, r.count])),
      fuelLitres: fuelAgg[0]?.litres ?? 0,
    },
  });
}

export async function getVehiclePnl(req: VercelRequest, res: VercelResponse) {
  await requirePermission(req, 'finance:view');

  const [vehicles, jobs, trips, expenses, fuel, maintenance] = await Promise.all([
    (await collection<VehicleDoc>(COLLECTIONS.vehicles)).find({}).toArray(),
    (await collection<JobDoc>(COLLECTIONS.jobs)).find({ vehicleId: { $ne: null } }).toArray(),
    (await collection<TripDoc>(COLLECTIONS.trips)).find({}).toArray(),
    (await collection<ExpenseDoc>(COLLECTIONS.expenses)).find({ vehicleId: { $ne: null } }).toArray(),
    (await collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers)).find({}).toArray(),
    (await collection<MaintenanceOrderDoc>(COLLECTIONS.maintenanceOrders)).find({}).toArray(),
  ]);

  const rows = vehicles.map((v) => {
    const vId = String(v._id);
    const revenue = jobs.filter((j) => j.vehicleId && String(j.vehicleId) === vId && j.status === 'Completed').reduce((s, j) => s + j.revenue, 0);
    const tripCount = trips.filter((t) => String(t.vehicleId) === vId).length;
    const expenseCost = expenses.filter((e) => e.vehicleId && String(e.vehicleId) === vId).reduce((s, e) => s + e.amount, 0);
    const fuelCost = fuel.filter((f) => String(f.vehicleId) === vId).reduce((s, f) => s + f.total, 0);
    const maintenanceCost = maintenance
      .filter((m) => String(m.vehicleId) === vId)
      .reduce((s, m) => s + m.labourCost + m.parts.reduce((ps, p) => ps + p.cost * p.qty, 0), 0);
    const totalCost = Math.round((expenseCost + fuelCost + maintenanceCost) * 100) / 100;
    return {
      vehicleId: vId, unitNumber: v.unitNumber, registration: v.registration, type: v.type, status: v.status,
      trips: tripCount, revenue, expenseCost, fuelCost, maintenanceCost, totalCost,
      profit: Math.round((revenue - totalCost) * 100) / 100,
    };
  });

  json(res, 200, { items: rows });
}

async function groupByStatus<T extends { status: string }>(col: import('mongodb').Collection<T>): Promise<Record<string, number>> {
  const rows = await col.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

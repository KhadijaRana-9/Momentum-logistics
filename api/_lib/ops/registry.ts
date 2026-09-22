import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ObjectId } from 'mongodb';
import * as jobs from './jobs.js';
import * as trips from './trips.js';
import * as fleet from './fleet.js';
import * as maintenance from './maintenance.js';
import * as finance from './finance.js';
import * as alertsResource from './alertsResource.js';
import * as reports from './reports.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;
type IdHandler = (req: VercelRequest, res: VercelResponse, id: ObjectId) => Promise<void>;

interface ListCreateResource {
  list?: Handler;
  create?: Handler;
}

interface ItemResource {
  get?: IdHandler;
  update?: IdHandler;
  actions?: Record<string, IdHandler>;
}

/**
 * Everything under /api/ops is dispatched by `?resource=`. This keeps every
 * new operational entity (Jobs, Dispatch/Trips, Fleet, Maintenance, Finance,
 * Alerts) off the Vercel Hobby 12-function ceiling — the real logic for each
 * one lives in its own _lib/ops/*.ts module; these two files are just routers.
 */
export const LIST_CREATE: Record<string, ListCreateResource> = {
  jobs: { list: jobs.listJobs, create: jobs.createJob },
  trips: { list: trips.listTrips, create: trips.createTrip },
  vehicles: { list: fleet.listVehicles, create: fleet.createVehicle },
  drivers: { list: fleet.listDrivers, create: fleet.createDriver },
  workshops: { list: maintenance.listWorkshops, create: maintenance.createWorkshop },
  maintenance: { list: maintenance.listMaintenanceOrders, create: maintenance.createMaintenanceOrder },
  parts: { list: maintenance.listParts, create: maintenance.createPart },
  tyres: { list: maintenance.listTyres, create: maintenance.createTyre },
  expenses: { list: finance.listExpenses, create: finance.createExpense },
  fuel: { list: finance.listFuelVouchers, create: finance.createFuelVoucher },
  invoices: { list: finance.listInvoices, create: finance.createInvoice },
  alerts: { list: alertsResource.listAlerts },
  reports: { list: reports.getOpsReports },
  vehiclePnl: { list: reports.getVehiclePnl },
};

export const ITEM: Record<string, ItemResource> = {
  jobs: { get: jobs.getJob, update: jobs.updateJob },
  trips: { get: trips.getTrip, actions: { status: trips.updateTripStatus } },
  vehicles: { get: fleet.getVehicle, update: fleet.updateVehicle },
  drivers: { get: fleet.getDriver, update: fleet.updateDriver },
  workshops: { get: maintenance.getWorkshop },
  maintenance: { get: maintenance.getMaintenanceOrder, update: maintenance.updateMaintenanceOrder },
  parts: { get: maintenance.getPart, update: maintenance.updatePart },
  tyres: { get: maintenance.getTyre, update: maintenance.updateTyre },
  expenses: { get: finance.getExpense, actions: { status: finance.updateExpenseStatus } },
  fuel: { get: finance.getFuelVoucher },
  invoices: { get: finance.getInvoice, actions: { status: finance.updateInvoiceStatus } },
  alerts: { actions: { read: alertsResource.markAlertRead } },
};

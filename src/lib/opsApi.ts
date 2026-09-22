import { api } from './apiClient';

/**
 * Typed client for everything under /api/ops (Jobs, Dispatch/Trips, Fleet,
 * Maintenance, Finance, Alerts, Reports). Every resource is dispatched
 * server-side by `?resource=` — see api/_lib/ops/registry.ts.
 */

export const JOB_STATUSES = ['Created', 'Assigned', 'Dispatched', 'In Progress', 'Completed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export const TRIP_STATUSES = ['Dispatched', 'Started', 'In Transit', 'Delivered', 'Completed'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];
export const VEHICLE_STATUSES = ['Available', 'On Trip', 'Maintenance', 'Out of Service'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];
export const DRIVER_STATUSES = ['Active', 'On Trip', 'Off Duty', 'Suspended'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];
export const MAINTENANCE_STATUSES = ['Scheduled', 'In Progress', 'Awaiting Parts', 'Completed'] as const;
export const MAINTENANCE_CATEGORIES = ['Preventive', 'Repair', 'Inspection', 'Accident'] as const;
export const TYRE_STATUSES = ['In Service', 'In Stock', 'Retreaded', 'Scrapped'] as const;
export const EXPENSE_CATEGORIES = ['Tolls & Parking', 'Driver Meals', 'Loading/Unloading', 'Vehicle Wash', 'Driver Advance', 'Miscellaneous'] as const;
export const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Reimbursed'] as const;
export const FUEL_TYPES = ['Diesel', 'Petrol'] as const;
export const INVOICE_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Paid', 'Overdue', 'Disputed'] as const;

export interface Job {
  id: string; ref: string; rrrId: string; rrrRef: string; customerId: string; customerName: string;
  pickup: string; destination: string; route: string | null; loadingInfo: string | null; unloadingInfo: string | null;
  vehicleType: string; vehicleId: string | null; vehicleRef: string | null; driverId: string | null; driverName: string | null;
  scheduledDate: string; status: JobStatus; tripId: string | null; tripRef: string | null;
  revenue: number; billingStatus: 'Not Billed' | 'Pending' | 'Invoiced' | 'Paid'; notes: string | null;
  createdByName: string; createdAt: string; updatedAt: string;
}

export interface Trip {
  id: string; ref: string; jobId: string; jobRef: string; rrrId: string; rrrRef: string;
  customerId: string; customerName: string; vehicleId: string; vehicleRef: string; driverId: string; driverName: string;
  route: string; startLocation: string | null; endLocation: string | null; startTime: string; endTime: string | null;
  startOdometer: number | null; endOdometer: number | null; distanceKm: number | null; status: TripStatus;
  notes: string | null; createdByName: string; createdAt: string; updatedAt: string;
}

export interface Vehicle {
  id: string; unitNumber: string; registration: string; type: string; make: string | null; model: string | null; year: number | null;
  homeBranch: string | null; status: VehicleStatus; odometer: number;
  lastServiceDate: string | null; nextServiceDue: string | null; insuranceExpiry: string | null; registrationExpiry: string | null;
  driverId: string | null; driverName: string | null; notes: string | null; createdAt: string; updatedAt: string;
}

export interface Driver {
  id: string; name: string; phone: string | null; nationality: string | null; licenseNumber: string; licenseExpiry: string | null;
  homeBranch: string | null; status: DriverStatus; assignedVehicleId: string | null; assignedVehicleRef: string | null;
  joinDate: string | null; notes: string | null; createdAt: string; updatedAt: string;
}

export interface Workshop {
  id: string; name: string; type: 'Internal' | 'External'; city: string | null; specialties: string[]; contact: string | null;
  createdAt: string; updatedAt: string;
}

export interface MaintenanceOrder {
  id: string; ref: string; vehicleId: string; vehicleRef: string; workshopId: string; workshopName: string;
  category: (typeof MAINTENANCE_CATEGORIES)[number]; problem: string; diagnosis: string | null; workPerformed: string | null;
  parts: { name: string; qty: number; cost: number }[]; labourCost: number; totalCost: number;
  startDate: string; endDate: string | null; warranty: string | null;
  status: (typeof MAINTENANCE_STATUSES)[number]; odometer: number | null; createdAt: string; updatedAt: string;
}

export interface Part {
  id: string; name: string; category: string | null; sku: string; stock: number; minStock: number; unitCost: number;
  supplier: string | null; status: 'Healthy' | 'Low' | 'Critical' | 'Out of Stock'; createdAt: string; updatedAt: string;
}

export interface Tyre {
  id: string; brand: string; size: string; serial: string; vehicleId: string | null; vehicleRef: string | null; position: string | null;
  installKm: number | null; removalKm: number | null; treadDepth: number | null; cost: number | null;
  status: (typeof TYRE_STATUSES)[number]; replacementReason: string | null; createdAt: string; updatedAt: string;
}

export interface Expense {
  id: string; ref: string; category: (typeof EXPENSE_CATEGORIES)[number]; tripId: string | null; tripRef: string | null;
  driverId: string | null; driverName: string | null; vehicleId: string | null; vehicleRef: string | null;
  amount: number; date: string; description: string | null; approvalStatus: (typeof EXPENSE_STATUSES)[number];
  createdByName: string; createdAt: string; updatedAt: string;
}

export interface FuelVoucher {
  id: string; ref: string; vehicleId: string; vehicleRef: string; driverId: string | null; driverName: string | null;
  station: string | null; date: string; odometer: number | null; litres: number; rate: number; total: number;
  fuelType: (typeof FUEL_TYPES)[number]; tripId: string | null; tripRef: string | null; createdAt: string; updatedAt: string;
}

export interface InvoiceChargeLine { description: string; amount: number; }
export interface Invoice {
  id: string; ref: string; customerId: string; customerName: string; contractRef: string | null;
  jobRefs: string[]; tripRefs: string[]; charges: InvoiceChargeLine[]; additionalCharges: InvoiceChargeLine[];
  discount: number; taxRate: number; subtotal: number; tax: number; total: number;
  status: (typeof INVOICE_STATUSES)[number]; issueDate: string; dueDate: string; createdAt: string; updatedAt: string;
}

export interface AlertItem {
  id: string; severity: 'Critical' | 'High' | 'Medium' | 'Low'; module: string; title: string; description: string | null;
  entityType: string | null; entityRef: string | null; read: boolean; createdAt: string;
}

export interface OpsReports {
  rrr: { total: number; byStatus: Record<string, number> };
  jobs: { total: number; byStatus: Record<string, number> };
  trips: { total: number; byStatus: Record<string, number>; completed: number };
  fleet: { totalVehicles: number; byStatus: Record<string, number>; totalDrivers: number; driversByStatus: Record<string, number> };
  driverActivity: { driverId: string; driverName: string; trips: number }[];
  finance: { revenue: number; expenses: number; fuel: number; maintenance: number; profitLoss: number; invoicesByStatus: Record<string, number>; fuelLitres: number };
}

export interface VehiclePnlRow {
  vehicleId: string; unitNumber: string; registration: string; type: string; status: string;
  trips: number; revenue: number; expenseCost: number; fuelCost: number; maintenanceCost: number; totalCost: number; profit: number;
}

interface Paged<T> { items: T[]; page: number; limit: number; total: number; totalPages: number; }

const list = <T>(resource: string, query?: Record<string, string | number | undefined>, signal?: AbortSignal) =>
  api.get<Paged<T>>('/ops', { resource, ...query }, signal);
const simpleList = <T>(resource: string, signal?: AbortSignal) =>
  api.get<{ items: T[]; total: number }>('/ops', { resource }, signal);
const get = <T>(resource: string, key: string, id: string, signal?: AbortSignal) =>
  api.get<Record<string, T>>(`/ops/${id}`, { resource }, signal).then((r) => ({ [key]: r[key] } as Record<string, T>)[key]);
const create = <T>(resource: string, key: string, body: Record<string, unknown>) =>
  api.post<Record<string, T>>(`/ops?resource=${resource}`, body).then((r) => r[key]);
const update = <T>(resource: string, key: string, id: string, body: Record<string, unknown>) =>
  api.patch<Record<string, T>>(`/ops/${id}?resource=${resource}`, body).then((r) => r[key]);
const action = <T>(resource: string, key: string, id: string, actionName: string, body: Record<string, unknown>) =>
  api.post<Record<string, T>>(`/ops/${id}?resource=${resource}&action=${actionName}`, body).then((r) => r[key]);

export const opsApi = {
  jobs: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Job>('jobs', query, signal),
    get: (id: string, signal?: AbortSignal) => get<Job>('jobs', 'job', id, signal),
    createFromRrr: (rrrId: string) => create<Job>('jobs', 'job', { rrrId }),
    update: (id: string, body: Record<string, unknown>) => update<Job>('jobs', 'job', id, body),
  },
  trips: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Trip>('trips', query, signal),
    get: (id: string, signal?: AbortSignal) => get<Trip>('trips', 'trip', id, signal),
    dispatch: (jobId: string, body: Record<string, unknown> = {}) => create<Trip>('trips', 'trip', { jobId, ...body }),
    setStatus: (id: string, status: TripStatus, extra: Record<string, unknown> = {}) => action<Trip>('trips', 'trip', id, 'status', { status, ...extra }),
  },
  vehicles: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Vehicle>('vehicles', query, signal),
    get: (id: string, signal?: AbortSignal) => get<Vehicle>('vehicles', 'vehicle', id, signal),
    create: (body: Record<string, unknown>) => create<Vehicle>('vehicles', 'vehicle', body),
    update: (id: string, body: Record<string, unknown>) => update<Vehicle>('vehicles', 'vehicle', id, body),
  },
  drivers: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Driver>('drivers', query, signal),
    get: (id: string, signal?: AbortSignal) => get<Driver>('drivers', 'driver', id, signal),
    create: (body: Record<string, unknown>) => create<Driver>('drivers', 'driver', body),
    update: (id: string, body: Record<string, unknown>) => update<Driver>('drivers', 'driver', id, body),
  },
  workshops: {
    list: (signal?: AbortSignal) => simpleList<Workshop>('workshops', signal),
    create: (body: Record<string, unknown>) => create<Workshop>('workshops', 'workshop', body),
  },
  maintenance: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<MaintenanceOrder>('maintenance', query, signal),
    get: (id: string, signal?: AbortSignal) => get<MaintenanceOrder>('maintenance', 'maintenanceOrder', id, signal),
    create: (body: Record<string, unknown>) => create<MaintenanceOrder>('maintenance', 'maintenanceOrder', body),
    update: (id: string, body: Record<string, unknown>) => update<MaintenanceOrder>('maintenance', 'maintenanceOrder', id, body),
  },
  parts: {
    list: (signal?: AbortSignal) => simpleList<Part>('parts', signal),
    create: (body: Record<string, unknown>) => create<Part>('parts', 'part', body),
    update: (id: string, body: Record<string, unknown>) => update<Part>('parts', 'part', id, body),
  },
  tyres: {
    list: (signal?: AbortSignal) => simpleList<Tyre>('tyres', signal),
    create: (body: Record<string, unknown>) => create<Tyre>('tyres', 'tyre', body),
    update: (id: string, body: Record<string, unknown>) => update<Tyre>('tyres', 'tyre', id, body),
  },
  expenses: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Expense>('expenses', query, signal),
    create: (body: Record<string, unknown>) => create<Expense>('expenses', 'expense', body),
    setStatus: (id: string, approvalStatus: string) => action<Expense>('expenses', 'expense', id, 'status', { approvalStatus }),
  },
  fuel: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<FuelVoucher>('fuel', query, signal),
    create: (body: Record<string, unknown>) => create<FuelVoucher>('fuel', 'fuelVoucher', body),
  },
  invoices: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) => list<Invoice>('invoices', query, signal),
    get: (id: string, signal?: AbortSignal) => get<Invoice>('invoices', 'invoice', id, signal),
    create: (body: Record<string, unknown>) => create<Invoice>('invoices', 'invoice', body),
    setStatus: (id: string, status: string) => action<Invoice>('invoices', 'invoice', id, 'status', { status }),
  },
  alerts: {
    list: (query?: Record<string, string | number | undefined>, signal?: AbortSignal) =>
      api.get<Paged<AlertItem> & { unreadOnPage: number }>('/ops', { resource: 'alerts', ...query }, signal),
    markRead: (id: string) => action<AlertItem>('alerts', 'alert', id, 'read', {}),
  },
  reports: {
    get: (signal?: AbortSignal) => api.get<OpsReports>('/ops', { resource: 'reports' }, signal),
  },
  vehiclePnl: {
    get: (signal?: AbortSignal) => api.get<{ items: VehiclePnlRow[] }>('/ops', { resource: 'vehiclePnl' }, signal),
  },
};

export interface Customer {
  id: string;
  name: string;
  industry: string;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contractType: 'Contract' | 'Spot' | 'Rate Card';
  creditLimit: number;
  outstandingBalance: number;
  activeSince: string;
}

export interface Vehicle {
  id: string;
  unitNumber: string;
  registration: string;
  type: string;
  make: string;
  model: string;
  year: number;
  driverId: string | null;
  homeBranch: string;
  location: string;
  coords: { x: number; y: number };
  status: 'Moving' | 'Idle' | 'Offline' | 'Maintenance' | 'Out of Service';
  trackerStatus: 'Online' | 'Offline' | 'Weak Signal';
  odometer: number;
  fuelLevel: number;
  lastServiceDate: string;
  nextServiceDue: string;
  nextServiceKm: number;
  insuranceExpiry: string;
  registrationExpiry: string;
  utilization: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  nationality: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedVehicleId: string | null;
  status: 'Active' | 'On Trip' | 'Off Duty' | 'On Leave' | 'Suspended';
  joinDate: string;
  totalTrips: number;
  rating: number;
  incidents: number;
  homeBranch: string;
}

export type RrrStatus = 'Draft' | 'Submitted' | 'Approved' | 'Assigned' | 'Job Created' | 'Dispatched' | 'Completed' | 'Rejected';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Rrr {
  id: string;
  date: string;
  customerId: string;
  department: string;
  vehicleType: string;
  driverRequired: boolean;
  pickup: string;
  destination: string;
  route: string;
  loadingInfo: string;
  unloadingInfo: string;
  requiredDate: string;
  priority: Priority;
  specialInstructions: string;
  contractRef: string;
  status: RrrStatus;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  jobId?: string;
  requestedBy: string;
  approvedBy?: string;
}

export type JobStatus = 'New' | 'Ready' | 'Assigned' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Trip Closed' | 'Invoiced';

export interface Job {
  id: string;
  rrrId: string;
  customerId: string;
  vehicleId?: string;
  driverId?: string;
  route: string;
  scheduledDate: string;
  status: JobStatus;
  tripId?: string;
  billingStatus: 'Not Billed' | 'Pending' | 'Invoiced' | 'Paid';
  revenue: number;
}

export type TripStatus = 'Created' | 'Dispatched' | 'Started' | 'In Transit' | 'Arrived' | 'Delivered' | 'Closed' | 'Verified' | 'Financially Closed' | 'Delayed';

export interface Trip {
  id: string;
  jobId: string;
  rrrId: string;
  vehicleId: string;
  driverId: string;
  customerId: string;
  route: string;
  startTime: string;
  endTime: string | null;
  startLocation: string;
  endLocation: string;
  startOdometer: number;
  endOdometer: number | null;
  distance: number;
  fuelLitres: number;
  fuelCost: number;
  tolls: number;
  meals: number;
  loadingCharges: number;
  miscExpenses: number;
  incentives: number;
  advance: number;
  revenue: number;
  status: TripStatus;
  eta?: string;
}

export interface Workshop {
  id: string;
  name: string;
  type: 'Internal' | 'External';
  city: string;
  specialties: string[];
  contact: string;
  activeJobs: number;
  rating: number;
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Awaiting Parts';

export interface MaintenanceOrder {
  id: string;
  vehicleId: string;
  workshopId: string;
  category: 'Preventive' | 'Repair' | 'Inspection' | 'Accident';
  problem: string;
  diagnosis: string;
  workPerformed: string;
  parts: { name: string; qty: number; cost: number }[];
  labourCost: number;
  startDate: string;
  endDate: string | null;
  warranty: string;
  status: MaintenanceStatus;
  odometer: number;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  minStock: number;
  unitCost: number;
  supplier: string;
  status: 'Healthy' | 'Low' | 'Critical' | 'Out of Stock';
}

export interface Tyre {
  id: string;
  brand: string;
  size: string;
  serial: string;
  vehicleId: string | null;
  position: string;
  installKm: number;
  removalKm: number | null;
  treadDepth: number;
  cost: number;
  status: 'In Service' | 'In Stock' | 'Retreaded' | 'Scrapped';
  replacementReason?: string;
}

export interface FuelVoucher {
  id: string;
  vehicleId: string;
  driverId: string;
  station: string;
  date: string;
  odometer: number;
  litres: number;
  rate: number;
  total: number;
  fuelType: 'Diesel' | 'Petrol';
  tripId?: string;
  receiptAttached: boolean;
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';

export interface ExpenseVoucher {
  id: string;
  category: string;
  tripId?: string;
  driverId: string;
  vehicleId?: string;
  amount: number;
  date: string;
  description: string;
  receiptAttached: boolean;
  approvalStatus: ApprovalStatus;
  flagged?: boolean;
}

export type InvoiceStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Paid' | 'Overdue' | 'Disputed';

export interface InvoiceCharge {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  contractRef: string;
  jobIds: string[];
  tripIds: string[];
  charges: InvoiceCharge[];
  additionalCharges: InvoiceCharge[];
  discount: number;
  taxRate: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  module: string;
  title: string;
  description: string;
  entity: string;
  timestamp: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  entity: string;
  module: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Invited';
  lastActive: string;
  avatarColor: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
}

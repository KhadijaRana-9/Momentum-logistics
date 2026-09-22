import type { IndexSpecification, CreateIndexesOptions, ObjectId } from 'mongodb';

/**
 * MongoDB schema definitions for the Momentum Logistics CRM / lead platform.
 *
 * Design notes
 * - One `leads` document per (email or phone) identity. Repeat form submissions
 *   attach a new activity + submission rather than creating a duplicate lead.
 * - `activities` is an append-only timeline keyed by leadId.
 * - `submissions` keeps the raw, immutable payload of every public form/chat.
 * - Scores are deterministic and stored with their contributing factors.
 */

export const COLLECTIONS = {
  users: 'users',
  leads: 'leads',
  activities: 'activities',
  followups: 'followups',
  submissions: 'submissions',
  analyticsEvents: 'analytics_events',
  auditLogs: 'audit_logs',
  chatSessions: 'chat_sessions',
  blogPosts: 'blog_posts',
  caseStudies: 'case_studies',
  testimonials: 'testimonials',
  webinars: 'webinars',
  webinarRegistrations: 'webinar_registrations',
  counters: 'counters',
  rateLimits: 'rate_limits',
  customers: 'customers',
  rrrs: 'rrrs',
  jobs: 'jobs',
  trips: 'trips',
  vehicles: 'vehicles',
  drivers: 'drivers',
  workshops: 'workshops',
  maintenanceOrders: 'maintenance_orders',
  parts: 'parts',
  tyres: 'tyres',
  expenses: 'expenses',
  fuelVouchers: 'fuel_vouchers',
  invoices: 'invoices',
  alerts: 'alerts',
  attachments: 'attachments',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Demo Scheduled',
  'Demo Completed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TEMPERATURES = ['Cold', 'Warm', 'Hot'] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const PRODUCTS = ['ERP Suite', 'FBR Invoicing', 'Cloud & AI', 'Custom Software', 'Unspecified'] as const;
export type ProductInterest = (typeof PRODUCTS)[number];

export const SERVICE_TYPES = ['Demo', 'Consultation', 'Quote', 'Support', 'Partnership', 'General'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const LEAD_SOURCES = [
  'Organic Search',
  'Google Ads',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'X/Twitter',
  'Direct',
  'Referral',
  'Website',
  'Landing Page',
  'Chatbot',
  'Webinar',
  'Import',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const SUBMISSION_TYPES = [
  'demo_request',
  'contact',
  'quote_request',
  'erp_demo',
  'software_consultation',
  'fbr_inquiry',
  'cloud_ai_inquiry',
  'chatbot',
  'webinar_registration',
  'newsletter',
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const FOLLOWUP_STATUSES = ['Pending', 'Completed', 'Cancelled', 'Overdue'] as const;
export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

export const FOLLOWUP_TYPES = ['Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Other'] as const;
export type FollowupType = (typeof FOLLOWUP_TYPES)[number];

export const ACTIVITY_TYPES = [
  'lead_created',
  'form_submitted',
  'page_viewed',
  'product_viewed',
  'chatbot_interaction',
  'lead_assigned',
  'status_changed',
  'priority_changed',
  'note_added',
  'tag_added',
  'email_sent',
  'followup_created',
  'followup_completed',
  'demo_scheduled',
  'demo_completed',
  'proposal_sent',
  'lead_won',
  'lead_lost',
  'score_recalculated',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// RRR (requisition request) --------------------------------------------------

export const RRR_STATUSES = [
  'Draft', 'Submitted', 'Approved', 'Assigned', 'Job Created', 'Dispatched', 'Completed', 'Rejected',
] as const;
export type RrrStatus = (typeof RRR_STATUSES)[number];

export const RRR_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type RrrPriority = (typeof RRR_PRIORITIES)[number];

// Operations: Jobs -> Dispatch -> Trips --------------------------------------
// Workflow (explicit, server-enforced, no skipped states):
//   Approved RRR -> Job "Created" -> "Assigned" (vehicle+driver set) ->
//   "Dispatched" (Trip created) -> "In Progress" (Trip started/in transit) -> "Completed"

export const JOB_STATUSES = ['Created', 'Assigned', 'Dispatched', 'In Progress', 'Completed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const BILLING_STATUSES = ['Not Billed', 'Pending', 'Invoiced', 'Paid'] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

// A Trip is created by the "dispatch" action on an Assigned job — there is no
// separate dispatches collection; dispatching *is* creating the Trip.
export const TRIP_STATUSES = ['Dispatched', 'Started', 'In Transit', 'Delivered', 'Completed'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

// Fleet ----------------------------------------------------------------------

export const VEHICLE_STATUSES = ['Available', 'On Trip', 'Maintenance', 'Out of Service'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ['Active', 'On Trip', 'Off Duty', 'Suspended'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

// Maintenance ------------------------------------------------------------------

export const MAINTENANCE_CATEGORIES = ['Preventive', 'Repair', 'Inspection', 'Accident'] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const MAINTENANCE_STATUSES = ['Scheduled', 'In Progress', 'Awaiting Parts', 'Completed'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const TYRE_STATUSES = ['In Service', 'In Stock', 'Retreaded', 'Scrapped'] as const;
export type TyreStatus = (typeof TYRE_STATUSES)[number];

// Finance ----------------------------------------------------------------------

export const EXPENSE_CATEGORIES = [
  'Tolls & Parking', 'Driver Meals', 'Loading/Unloading', 'Vehicle Wash', 'Driver Advance', 'Miscellaneous',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Reimbursed'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const FUEL_TYPES = ['Diesel', 'Petrol'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const INVOICE_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Paid', 'Overdue', 'Disputed'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// Alerts / notifications --------------------------------------------------------

export const ALERT_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

// RBAC ---------------------------------------------------------------------

export const PERMISSIONS = [
  'leads:view',
  'leads:create',
  'leads:edit',
  'leads:assign',
  'leads:delete',
  'followups:view',
  'followups:manage',
  'analytics:view',
  'content:manage',
  'campaigns:manage',
  'chatbot:manage',
  'integrations:manage',
  'users:manage',
  'audit:view',
  'rrr:view',
  'rrr:create',
  'rrr:edit',
  'rrr:approve',
  'jobs:view',
  'jobs:manage',
  'dispatch:view',
  'dispatch:manage',
  'trips:view',
  'trips:manage',
  'fleet:view',
  'fleet:manage',
  'maintenance:view',
  'maintenance:manage',
  'finance:view',
  'finance:manage',
  'alerts:view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[] | '*'> = {
  admin: '*',
  sales_manager: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:assign', 'leads:delete',
    'followups:view', 'followups:manage', 'analytics:view', 'content:manage',
    'campaigns:manage', 'audit:view',
    'rrr:view', 'rrr:create', 'rrr:edit', 'rrr:approve',
    // Operational manager: full read/write across the ops pipeline, fleet, maintenance and finance.
    'jobs:view', 'jobs:manage', 'dispatch:view', 'dispatch:manage', 'trips:view', 'trips:manage',
    'fleet:view', 'fleet:manage', 'maintenance:view', 'maintenance:manage', 'finance:view', 'finance:manage',
    'alerts:view',
  ],
  sales_rep: [
    'leads:view', 'leads:create', 'leads:edit',
    'followups:view', 'followups:manage', 'analytics:view',
    'rrr:view', 'rrr:create', 'rrr:edit',
    // Front-line: can run the RRR they raised through Job/Dispatch/Trip, but not
    // manage fleet assets, maintenance work orders or finance records.
    'jobs:view', 'jobs:manage', 'dispatch:view', 'dispatch:manage', 'trips:view', 'trips:manage',
    'fleet:view', 'maintenance:view', 'finance:view', 'alerts:view',
  ],
  marketing: [
    'leads:view', 'analytics:view', 'content:manage', 'campaigns:manage', 'chatbot:manage',
    'rrr:view',
    'jobs:view', 'dispatch:view', 'trips:view', 'fleet:view', 'maintenance:view', 'finance:view', 'alerts:view',
  ],
  viewer: [
    'leads:view', 'followups:view', 'analytics:view', 'rrr:view',
    'jobs:view', 'dispatch:view', 'trips:view', 'fleet:view', 'maintenance:view', 'finance:view', 'alerts:view',
  ],
};

export function permissionsForRole(role: string): Permission[] {
  const p = ROLE_PERMISSIONS[role];
  if (p === '*') return [...PERMISSIONS];
  return p ?? [];
}

// ---------------------------------------------------------------------------
// Document shapes
// ---------------------------------------------------------------------------

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDoc extends Timestamps {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: keyof typeof ROLE_PERMISSIONS | string;
  /** Explicit permission overrides; when absent the role's defaults apply. */
  permissions?: Permission[];
  status: 'active' | 'invited' | 'suspended';
  lastLoginAt?: Date;
  avatarColor?: string;
  /**
   * Marks a record created by scripts/seed-dev-users.mjs. Lets the seed script
   * recognise its own accounts on re-run (idempotent upsert) without ever
   * touching a real user who happens to share an email — and gives everyone
   * else an obvious signal these are test accounts, not production users.
   */
  seedAccount?: boolean;
}

export interface Attribution {
  source: LeadSource;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
  referrer?: string;
  firstTouchSource?: LeadSource;
  lastTouchSource?: LeadSource;
  gclid?: string;
  fbclid?: string;
}

export interface ScoreFactor {
  label: string;
  points: number;
}

export interface LeadDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // human-readable, e.g. LEAD-000042
  name: string;
  email?: string;
  emailNormalized?: string;
  phone?: string;
  phoneNormalized?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  jobTitle?: string;
  website?: string;
  isBusinessEmail?: boolean;

  productInterest: ProductInterest;
  serviceType: ServiceType;
  budget?: string;
  timeline?: string;
  requirements?: string;

  attribution: Attribution;
  campaign?: string;

  score: number;
  scoreFactors: ScoreFactor[];
  temperature: LeadTemperature;

  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: ObjectId | null;
  assignedToName?: string | null;

  tags: string[];
  notesCount: number;
  submissionsCount: number;
  followUpAt?: Date | null;
  lastActivityAt: Date;

  /** Soft-delete / archive. */
  archived?: boolean;
}

export interface ActivityDoc {
  _id?: ObjectId;
  leadId: ObjectId;
  type: ActivityType;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
  /** null = system/automated, otherwise the acting staff user. */
  actorId?: ObjectId | null;
  actorName: string;
  createdAt: Date;
}

export interface FollowupDoc extends Timestamps {
  _id?: ObjectId;
  leadId: ObjectId;
  leadRef: string;
  assignedTo: ObjectId;
  assignedToName: string;
  dueAt: Date;
  type: FollowupType;
  notes?: string;
  status: FollowupStatus;
  priority: LeadPriority;
  completedAt?: Date | null;
  createdBy: ObjectId;
}

export interface CustomerDoc extends Timestamps {
  _id?: ObjectId;
  name: string;
  industry?: string;
  city?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contractType?: 'Contract' | 'Spot' | 'Rate Card';
  creditLimit?: number;
  outstandingBalance?: number;
  activeSince?: Date;
}

export interface RrrDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. RRR-000042
  customerId: ObjectId;
  customerName: string; // denormalised for fast list rendering
  department?: string;
  vehicleType: string;
  driverRequired: boolean;
  numberOfVehicles: number;
  pickup: string;
  destination: string;
  route?: string;
  loadingInfo?: string;
  unloadingInfo?: string;
  requiredDate: Date;
  priority: RrrPriority;
  specialInstructions?: string;
  contractRef?: string;
  status: RrrStatus;
  /**
   * Vehicle/driver/job linkage is intentionally string-only for now — the
   * Fleet (vehicles/drivers) and Jobs modules are not backed by MongoDB yet,
   * so there is nothing real to reference. Populated once those exist.
   */
  assignedVehicleRef?: string | null;
  assignedDriverRef?: string | null;
  jobRef?: string | null;
  requestedBy: ObjectId;
  requestedByName: string;
  approvedBy?: ObjectId | null;
  approvedByName?: string | null;
  rejectionReason?: string | null;
}

// Operations: Jobs, Trips ----------------------------------------------------

export interface JobDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. JOB-000042
  rrrId: ObjectId;
  rrrRef: string;
  customerId: ObjectId;
  customerName: string;
  pickup: string;
  destination: string;
  route?: string;
  loadingInfo?: string;
  unloadingInfo?: string;
  vehicleType: string;
  vehicleId?: ObjectId | null;
  vehicleRef?: string | null;
  driverId?: ObjectId | null;
  driverName?: string | null;
  scheduledDate: Date;
  status: JobStatus;
  tripId?: ObjectId | null;
  tripRef?: string | null;
  revenue: number;
  billingStatus: BillingStatus;
  notes?: string;
  createdBy: ObjectId;
  createdByName: string;
}

export interface TripDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. TRP-000042
  jobId: ObjectId;
  jobRef: string;
  rrrId: ObjectId;
  rrrRef: string;
  customerId: ObjectId;
  customerName: string;
  vehicleId: ObjectId;
  vehicleRef: string;
  driverId: ObjectId;
  driverName: string;
  route: string;
  startLocation?: string;
  endLocation?: string;
  startTime: Date;
  endTime?: Date | null;
  startOdometer?: number | null;
  endOdometer?: number | null;
  status: TripStatus;
  notes?: string;
  createdBy: ObjectId;
  createdByName: string;
}

// Fleet ------------------------------------------------------------------------

export interface VehicleDoc extends Timestamps {
  _id?: ObjectId;
  unitNumber: string;
  registration: string;
  type: string;
  make?: string;
  model?: string;
  year?: number;
  homeBranch?: string;
  status: VehicleStatus;
  odometer: number;
  lastServiceDate?: Date | null;
  nextServiceDue?: Date | null;
  insuranceExpiry?: Date | null;
  registrationExpiry?: Date | null;
  driverId?: ObjectId | null;
  driverName?: string | null;
  notes?: string;
  createdBy: ObjectId;
}

export interface DriverDoc extends Timestamps {
  _id?: ObjectId;
  name: string;
  phone?: string;
  nationality?: string;
  licenseNumber: string;
  licenseExpiry?: Date | null;
  homeBranch?: string;
  status: DriverStatus;
  assignedVehicleId?: ObjectId | null;
  assignedVehicleRef?: string | null;
  joinDate?: Date | null;
  notes?: string;
  createdBy: ObjectId;
}

// Maintenance --------------------------------------------------------------------

export interface WorkshopDoc extends Timestamps {
  _id?: ObjectId;
  name: string;
  type: 'Internal' | 'External';
  city?: string;
  specialties?: string[];
  contact?: string;
  createdBy: ObjectId;
}

export interface MaintenancePartLine {
  name: string;
  qty: number;
  cost: number;
}

export interface MaintenanceOrderDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. WO-000042
  vehicleId: ObjectId;
  vehicleRef: string;
  workshopId: ObjectId;
  workshopName: string;
  category: MaintenanceCategory;
  problem: string;
  diagnosis?: string;
  workPerformed?: string;
  parts: MaintenancePartLine[];
  labourCost: number;
  startDate: Date;
  endDate?: Date | null;
  warranty?: string;
  status: MaintenanceStatus;
  odometer?: number;
  createdBy: ObjectId;
}

export interface PartDoc extends Timestamps {
  _id?: ObjectId;
  name: string;
  category?: string;
  sku: string;
  stock: number;
  minStock: number;
  unitCost: number;
  supplier?: string;
  createdBy: ObjectId;
}

export interface TyreDoc extends Timestamps {
  _id?: ObjectId;
  brand: string;
  size: string;
  serial: string;
  vehicleId?: ObjectId | null;
  vehicleRef?: string | null;
  position?: string;
  installKm?: number;
  removalKm?: number | null;
  treadDepth?: number;
  cost?: number;
  status: TyreStatus;
  replacementReason?: string;
  createdBy: ObjectId;
}

// Finance ------------------------------------------------------------------------

export interface ExpenseDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. EX-000042
  category: ExpenseCategory;
  tripId?: ObjectId | null;
  tripRef?: string | null;
  driverId?: ObjectId | null;
  driverName?: string | null;
  vehicleId?: ObjectId | null;
  vehicleRef?: string | null;
  amount: number;
  date: Date;
  description?: string;
  approvalStatus: ExpenseStatus;
  createdBy: ObjectId;
  createdByName: string;
}

export interface FuelVoucherDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. FV-000042
  vehicleId: ObjectId;
  vehicleRef: string;
  driverId?: ObjectId | null;
  driverName?: string | null;
  station?: string;
  date: Date;
  odometer?: number;
  litres: number;
  rate: number;
  total: number; // = litres * rate, computed server-side at write time
  fuelType: FuelType;
  tripId?: ObjectId | null;
  tripRef?: string | null;
  createdBy: ObjectId;
}

export interface InvoiceCharge {
  description: string;
  amount: number;
}

export interface InvoiceDoc extends Timestamps {
  _id?: ObjectId;
  ref: string; // e.g. INV-000042
  customerId: ObjectId;
  customerName: string;
  contractRef?: string;
  jobIds: ObjectId[];
  jobRefs: string[];
  tripIds: ObjectId[];
  tripRefs: string[];
  charges: InvoiceCharge[];
  additionalCharges: InvoiceCharge[];
  discount: number;
  taxRate: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  createdBy: ObjectId;
}

// Alerts / notifications ----------------------------------------------------------

export const ATTACHMENT_PARENT_TYPES = ['rrr', 'expense', 'fuel'] as const;
export type AttachmentParentType = (typeof ATTACHMENT_PARENT_TYPES)[number];

export interface AttachmentDoc {
  _id?: ObjectId;
  filename: string;
  contentType: string;
  size: number;
  /** Path inside the private Vercel Blob store — never sent to the client directly. */
  blobPathname: string;
  parentType: AttachmentParentType;
  parentId: ObjectId;
  uploadedBy: ObjectId;
  uploadedByName: string;
  createdAt: Date;
}

export interface AlertDoc {
  _id?: ObjectId;
  severity: AlertSeverity;
  module: string;
  title: string;
  description?: string;
  entityType?: string;
  entityRef?: string;
  /** Gate: only staff who hold this permission can see a broadcast alert. null = everyone authenticated. */
  visibleToPermission?: Permission | null;
  /** A specific recipient (e.g. the RRR requester). null = broadcast to everyone matching visibleToPermission. */
  recipientId?: ObjectId | null;
  /** Who has dismissed a broadcast alert (per-viewer read state). */
  readBy: ObjectId[];
  createdAt: Date;
}

export interface SubmissionDoc {
  _id?: ObjectId;
  type: SubmissionType;
  leadId?: ObjectId;
  /** Raw, validated payload exactly as submitted (no secrets). */
  payload: Record<string, unknown>;
  attribution: Attribution;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AnalyticsEventDoc {
  _id?: ObjectId;
  event: string;
  anonymousId?: string;
  sessionId?: string;
  leadId?: ObjectId;
  path?: string;
  props?: Record<string, unknown>;
  attribution?: Partial<Attribution>;
  ua?: string;
  createdAt: Date;
}

export interface AuditLogDoc {
  _id?: ObjectId;
  actorId?: ObjectId | null;
  actorName: string;
  action: string; // e.g. "lead.status_changed"
  entity: string; // e.g. "lead"
  entityId?: string;
  changes?: { field: string; from: unknown; to: unknown }[];
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

export interface ChatSessionDoc extends Timestamps {
  _id?: ObjectId;
  sessionKey: string;
  leadId?: ObjectId;
  /** Current step in the deterministic qualification flow. */
  step: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string; at: Date }[];
  qualification: Partial<{
    industry: string;
    companySize: string;
    budget: string;
    timeline: string;
    productInterest: ProductInterest;
  }>;
  contact: Partial<{ name: string; email: string; phone: string; company: string }>;
  attribution: Attribution;
  status: 'active' | 'captured' | 'converted' | 'abandoned';
}

export interface ContentBase extends Timestamps {
  _id?: ObjectId;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date | null;
}

export interface BlogPostDoc extends ContentBase {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags: string[];
  author: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CaseStudyDoc extends ContentBase {
  client: string;
  slug: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  technologies: string[];
  images: string[];
  testimonial?: { quote: string; name: string; role: string };
}

export interface TestimonialDoc extends ContentBase {
  name: string;
  company: string;
  role: string;
  quote: string;
  image?: string;
}

export interface WebinarDoc extends ContentBase {
  title: string;
  slug: string;
  description: string;
  startsAt: Date;
  durationMinutes: number;
  host: string;
  recordingUrl?: string;
  registrationOpen: boolean;
}

export interface WebinarRegistrationDoc {
  _id?: ObjectId;
  webinarId: ObjectId;
  leadId?: ObjectId;
  name: string;
  email: string;
  company?: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Indexes — declared once, created idempotently by db.ensureIndexes()
// ---------------------------------------------------------------------------

interface IndexDef {
  key: IndexSpecification;
  options?: CreateIndexesOptions;
}

export const INDEXES: Record<string, IndexDef[]> = {
  [COLLECTIONS.users]: [
    { key: { email: 1 }, options: { unique: true } },
  ],
  [COLLECTIONS.leads]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { emailNormalized: 1 }, options: { sparse: true } },
    { key: { phoneNormalized: 1 }, options: { sparse: true } },
    { key: { status: 1, createdAt: -1 } },
    { key: { assignedTo: 1, status: 1 } },
    { key: { temperature: 1, score: -1 } },
    { key: { productInterest: 1 } },
    { key: { 'attribution.source': 1 } },
    { key: { 'attribution.campaign': 1 }, options: { sparse: true } },
    { key: { industry: 1 }, options: { sparse: true } },
    { key: { tags: 1 } },
    { key: { followUpAt: 1 }, options: { sparse: true } },
    { key: { createdAt: -1 } },
    { key: { archived: 1, createdAt: -1 } },
    { key: { name: 'text', company: 'text', email: 'text' }, options: { name: 'lead_text' } },
  ],
  [COLLECTIONS.activities]: [
    { key: { leadId: 1, createdAt: -1 } },
    { key: { type: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.followups]: [
    { key: { assignedTo: 1, status: 1, dueAt: 1 } },
    { key: { leadId: 1, createdAt: -1 } },
    { key: { status: 1, dueAt: 1 } },
    { key: { dueAt: 1 } },
  ],
  [COLLECTIONS.customers]: [
    { key: { name: 1 } },
    { key: { contactEmail: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.rrrs]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { status: 1, createdAt: -1 } },
    { key: { customerId: 1, createdAt: -1 } },
    { key: { requestedBy: 1, createdAt: -1 } },
    { key: { requiredDate: 1 } },
    { key: { priority: 1 } },
  ],
  [COLLECTIONS.jobs]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { rrrId: 1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { customerId: 1, createdAt: -1 } },
    { key: { vehicleId: 1 }, options: { sparse: true } },
    { key: { driverId: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.trips]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { jobId: 1 } },
    { key: { vehicleId: 1, createdAt: -1 } },
    { key: { driverId: 1, createdAt: -1 } },
    { key: { status: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.vehicles]: [
    { key: { registration: 1 }, options: { unique: true } },
    { key: { unitNumber: 1 }, options: { unique: true } },
    { key: { status: 1 } },
  ],
  [COLLECTIONS.drivers]: [
    { key: { licenseNumber: 1 }, options: { unique: true } },
    { key: { status: 1 } },
    { key: { assignedVehicleId: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.workshops]: [
    { key: { name: 1 } },
  ],
  [COLLECTIONS.maintenanceOrders]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { vehicleId: 1, createdAt: -1 } },
    { key: { workshopId: 1, createdAt: -1 } },
    { key: { status: 1 } },
  ],
  [COLLECTIONS.parts]: [
    { key: { sku: 1 }, options: { unique: true } },
    { key: { name: 1 } },
  ],
  [COLLECTIONS.tyres]: [
    { key: { serial: 1 }, options: { unique: true } },
    { key: { vehicleId: 1 }, options: { sparse: true } },
    { key: { status: 1 } },
  ],
  [COLLECTIONS.expenses]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { tripId: 1 }, options: { sparse: true } },
    { key: { driverId: 1, createdAt: -1 } },
    { key: { approvalStatus: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.fuelVouchers]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { vehicleId: 1, createdAt: -1 } },
    { key: { tripId: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.invoices]: [
    { key: { ref: 1 }, options: { unique: true } },
    { key: { customerId: 1, createdAt: -1 } },
    { key: { status: 1, dueDate: 1 } },
  ],
  [COLLECTIONS.alerts]: [
    { key: { createdAt: -1 } },
    { key: { recipientId: 1, createdAt: -1 }, options: { sparse: true } },
    { key: { visibleToPermission: 1, createdAt: -1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.attachments]: [
    { key: { parentType: 1, parentId: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.submissions]: [
    { key: { leadId: 1, createdAt: -1 } },
    { key: { type: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
  ],
  [COLLECTIONS.analyticsEvents]: [
    { key: { event: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
    { key: { anonymousId: 1, createdAt: -1 }, options: { sparse: true } },
    { key: { leadId: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.auditLogs]: [
    { key: { createdAt: -1 } },
    { key: { entity: 1, entityId: 1, createdAt: -1 } },
    { key: { actorId: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.chatSessions]: [
    { key: { sessionKey: 1 }, options: { unique: true } },
    { key: { status: 1, updatedAt: -1 } },
    { key: { leadId: 1 }, options: { sparse: true } },
  ],
  [COLLECTIONS.blogPosts]: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { status: 1, publishedAt: -1 } },
  ],
  [COLLECTIONS.caseStudies]: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { status: 1, publishedAt: -1 } },
  ],
  [COLLECTIONS.testimonials]: [
    { key: { status: 1, createdAt: -1 } },
  ],
  [COLLECTIONS.webinars]: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { status: 1, startsAt: -1 } },
  ],
  [COLLECTIONS.webinarRegistrations]: [
    { key: { webinarId: 1, email: 1 }, options: { unique: true } },
  ],
  [COLLECTIONS.counters]: [
    { key: { _id: 1 } },
  ],
  [COLLECTIONS.rateLimits]: [
    { key: { key: 1 }, options: { unique: true } },
    { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  ],
};

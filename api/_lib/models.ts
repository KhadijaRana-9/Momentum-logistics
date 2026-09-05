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
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[] | '*'> = {
  admin: '*',
  sales_manager: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:assign', 'leads:delete',
    'followups:view', 'followups:manage', 'analytics:view', 'content:manage',
    'campaigns:manage', 'audit:view',
  ],
  sales_rep: [
    'leads:view', 'leads:create', 'leads:edit',
    'followups:view', 'followups:manage', 'analytics:view',
  ],
  marketing: [
    'leads:view', 'analytics:view', 'content:manage', 'campaigns:manage', 'chatbot:manage',
  ],
  viewer: ['leads:view', 'followups:view', 'analytics:view'],
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

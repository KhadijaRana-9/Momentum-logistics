/** Frontend mirrors of the API's serialized CRM shapes. */

export const LEAD_STATUSES = [
  'New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Demo Completed',
  'Proposal Sent', 'Negotiation', 'Won', 'Lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TEMPERATURES = ['Cold', 'Warm', 'Hot'] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export type ProductInterest = 'ERP Suite' | 'FBR Invoicing' | 'Cloud & AI' | 'Custom Software' | 'Unspecified';

export interface ScoreFactor {
  label: string;
  points: number;
}

export interface Attribution {
  source: string;
  medium?: string;
  campaign?: string;
  landingPage?: string;
  referrer?: string;
  firstTouchSource?: string;
  lastTouchSource?: string;
}

export interface Lead {
  id: string;
  ref: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  companySize: string | null;
  industry: string | null;
  jobTitle: string | null;
  website: string | null;
  isBusinessEmail: boolean;
  productInterest: ProductInterest;
  serviceType: string;
  budget: string | null;
  timeline: string | null;
  requirements: string | null;
  attribution: Attribution;
  campaign: string | null;
  score: number;
  scoreFactors: ScoreFactor[];
  temperature: LeadTemperature;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string | null;
  assignedToName: string | null;
  tags: string[];
  notesCount: number;
  submissionsCount: number;
  followUpAt: string | null;
  lastActivityAt: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  actorName: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface Followup {
  id: string;
  leadId: string;
  leadRef: string;
  assignedTo: string;
  assignedToName: string;
  dueAt: string;
  type: string;
  notes: string | null;
  status: 'Pending' | 'Completed' | 'Cancelled';
  priority: LeadPriority;
  completedAt: string | null;
  overdue: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attribution: Attribution;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarColor: string | null;
  lastLoginAt: string | null;
}

export interface LeadListResponse {
  items: Lead[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadDetailResponse {
  lead: Lead;
  activities: Activity[];
  followups: Followup[];
  submissions: Submission[];
}

export interface AnalyticsSummary {
  rangeDays: number;
  overview: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    hotLeads: number;
    demoRequests: number;
    pendingFollowups: number;
    overdueFollowups: number;
    wonDeals: number;
    lostDeals: number;
    conversionRate: number;
  };
  pipeline: { stage: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  byProduct: { product: string; count: number }[];
  byIndustry: { industry: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  events: Record<string, number>;
}

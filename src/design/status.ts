// Centralized semantic status → tone mapping, used by <StatusBadge /> everywhere.
// Keeps color meaning consistent across every module instead of ad-hoc per-page colors.

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'orange';

export const TONE_CLASSES: Record<Tone, { bg: string; text: string; ring: string; dot: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/15', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/15', dot: 'bg-amber-500' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/15', dot: 'bg-rose-500' },
  info: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-600/15', dot: 'bg-sky-500' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-700', ring: 'ring-brand-600/15', dot: 'bg-brand-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/15', dot: 'bg-orange-500' },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-500/15', dot: 'bg-slate-400' },
};

const STATUS_TONE: Record<string, Tone> = {
  // Generic / approval
  draft: 'neutral',
  submitted: 'info',
  'pending approval': 'warning',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  active: 'success',
  inactive: 'neutral',
  suspended: 'danger',
  invited: 'warning',
  disputed: 'danger',

  // RRR / Job lifecycle
  assigned: 'brand',
  'job created': 'brand',
  new: 'warning',
  ready: 'warning',
  dispatched: 'info',
  'in transit': 'info',
  delivered: 'success',
  'trip closed': 'brand',
  invoiced: 'success',
  'on hold': 'warning',
  completed: 'success',

  // Trip
  created: 'neutral',
  started: 'info',
  arrived: 'brand',
  return: 'info',
  closed: 'neutral',
  verified: 'success',
  'financially closed': 'success',
  delayed: 'danger',

  // Fleet / tracking
  moving: 'success',
  idle: 'warning',
  offline: 'neutral',
  maintenance: 'orange',
  'out of service': 'danger',
  online: 'success',
  'weak signal': 'warning',

  // Driver
  'on trip': 'info',
  'off duty': 'neutral',
  'on leave': 'warning',

  // Maintenance
  scheduled: 'warning',
  'in progress': 'orange',
  overdue: 'danger',
  'awaiting parts': 'warning',

  // Inventory
  healthy: 'success',
  low: 'warning',
  critical: 'danger',
  'out of stock': 'danger',

  // Invoice / billing
  sent: 'info',
  paid: 'success',
  reimbursed: 'success',

  // Documents
  valid: 'success',
  'expiring soon': 'warning',
  expired: 'danger',

  // Priority
  urgent: 'danger',
  high: 'danger',
  medium: 'warning',

  // Alerts
  info: 'info',
};

export function getStatusTone(status: string): Tone {
  return STATUS_TONE[status.trim().toLowerCase()] ?? 'neutral';
}

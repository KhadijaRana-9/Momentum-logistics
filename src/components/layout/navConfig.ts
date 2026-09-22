import {
  LayoutDashboard, ClipboardList, Briefcase, Send, Route, Truck, UserRound, Satellite,
  Wrench, Hammer, PackageSearch, Disc, Receipt, Fuel, CreditCard, FileText, TrendingUp,
  BarChart3, Activity, Bell, Users, Settings, History, Target, GitBranch, CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/auth';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
  /** When set, the item is hidden for anyone without this permission (see Sidebar.tsx). */
  permission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/app', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { label: 'CRM Overview', to: '/app/crm', icon: Target },
      { label: 'Leads', to: '/app/crm/leads', icon: Users },
      { label: 'Pipeline', to: '/app/crm/pipeline', icon: GitBranch },
      { label: 'Follow-ups', to: '/app/crm/followups', icon: CalendarClock },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'RRR', to: '/app/rrr', icon: ClipboardList, permission: 'rrr:view' },
      { label: 'Jobs', to: '/app/jobs', icon: Briefcase, permission: 'jobs:view' },
      { label: 'Dispatch', to: '/app/dispatch', icon: Send, permission: 'dispatch:view' },
      { label: 'Trips', to: '/app/trips', icon: Route, permission: 'trips:view' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { label: 'Vehicles', to: '/app/fleet/vehicles', icon: Truck, permission: 'fleet:view' },
      { label: 'Drivers', to: '/app/fleet/drivers', icon: UserRound, permission: 'fleet:view' },
      { label: 'Live Tracking', to: '/app/fleet/tracking', icon: Satellite, permission: 'fleet:view' },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { label: 'Workshops', to: '/app/maintenance/workshops', icon: Wrench, permission: 'maintenance:view' },
      { label: 'Maintenance', to: '/app/maintenance', icon: Hammer, permission: 'maintenance:view' },
      { label: 'Parts', to: '/app/maintenance/parts', icon: PackageSearch, permission: 'maintenance:view' },
      { label: 'Tyres', to: '/app/maintenance/tyres', icon: Disc, permission: 'maintenance:view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', to: '/app/finance/expenses', icon: Receipt, permission: 'finance:view' },
      { label: 'Fuel', to: '/app/finance/fuel', icon: Fuel, permission: 'finance:view' },
      { label: 'Billing', to: '/app/finance/billing', icon: CreditCard, permission: 'finance:view' },
      { label: 'Invoices', to: '/app/finance/invoices', icon: FileText, permission: 'finance:view' },
      { label: 'Vehicle P&L', to: '/app/finance/vehicle-pnl', icon: TrendingUp, permission: 'finance:view' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', to: '/app/reports', icon: BarChart3, permission: 'analytics:view' },
      { label: 'Analytics', to: '/app/analytics', icon: Activity, permission: 'analytics:view' },
      { label: 'Alerts', to: '/app/alerts', icon: Bell, permission: 'alerts:view' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', to: '/app/admin/users', icon: Users, permission: 'users:manage' },
      { label: 'Settings', to: '/app/admin/settings', icon: Settings },
      { label: 'Audit Trail', to: '/app/admin/audit', icon: History, permission: 'audit:view' },
    ],
  },
];

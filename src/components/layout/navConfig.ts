import {
  LayoutDashboard, ClipboardList, Briefcase, Send, Route, Truck, UserRound, Satellite,
  Wrench, Hammer, PackageSearch, Disc, Receipt, Fuel, CreditCard, FileText, TrendingUp,
  BarChart3, Activity, Bell, Users, Settings, History, Target, GitBranch, CalendarClock,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
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
      { label: 'RRR', to: '/app/rrr', icon: ClipboardList },
      { label: 'Jobs', to: '/app/jobs', icon: Briefcase },
      { label: 'Dispatch', to: '/app/dispatch', icon: Send },
      { label: 'Trips', to: '/app/trips', icon: Route },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { label: 'Vehicles', to: '/app/fleet/vehicles', icon: Truck },
      { label: 'Drivers', to: '/app/fleet/drivers', icon: UserRound },
      { label: 'Live Tracking', to: '/app/fleet/tracking', icon: Satellite },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { label: 'Workshops', to: '/app/maintenance/workshops', icon: Wrench },
      { label: 'Maintenance', to: '/app/maintenance', icon: Hammer },
      { label: 'Parts', to: '/app/maintenance/parts', icon: PackageSearch },
      { label: 'Tyres', to: '/app/maintenance/tyres', icon: Disc },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', to: '/app/finance/expenses', icon: Receipt },
      { label: 'Fuel', to: '/app/finance/fuel', icon: Fuel },
      { label: 'Billing', to: '/app/finance/billing', icon: CreditCard },
      { label: 'Invoices', to: '/app/finance/invoices', icon: FileText },
      { label: 'Vehicle P&L', to: '/app/finance/vehicle-pnl', icon: TrendingUp },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', to: '/app/reports', icon: BarChart3 },
      { label: 'Analytics', to: '/app/analytics', icon: Activity },
      { label: 'Alerts', to: '/app/alerts', icon: Bell },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', to: '/app/admin/users', icon: Users },
      { label: 'Settings', to: '/app/admin/settings', icon: Settings },
      { label: 'Audit Trail', to: '/app/admin/audit', icon: History },
    ],
  },
];

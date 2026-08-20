import {
  LayoutDashboard, ClipboardList, Briefcase, Send, Route, Truck, UserRound, Satellite,
  Wrench, Hammer, PackageSearch, Disc, Receipt, Fuel, CreditCard, FileText, TrendingUp,
  BarChart3, Activity, Bell, Users, Settings, History, type LucideIcon,
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
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'RRR', to: '/rrr', icon: ClipboardList },
      { label: 'Jobs', to: '/jobs', icon: Briefcase },
      { label: 'Dispatch', to: '/dispatch', icon: Send },
      { label: 'Trips', to: '/trips', icon: Route },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { label: 'Vehicles', to: '/fleet/vehicles', icon: Truck },
      { label: 'Drivers', to: '/fleet/drivers', icon: UserRound },
      { label: 'Live Tracking', to: '/fleet/tracking', icon: Satellite },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { label: 'Workshops', to: '/maintenance/workshops', icon: Wrench },
      { label: 'Maintenance', to: '/maintenance', icon: Hammer },
      { label: 'Parts', to: '/maintenance/parts', icon: PackageSearch },
      { label: 'Tyres', to: '/maintenance/tyres', icon: Disc },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', to: '/finance/expenses', icon: Receipt },
      { label: 'Fuel', to: '/finance/fuel', icon: Fuel },
      { label: 'Billing', to: '/finance/billing', icon: CreditCard },
      { label: 'Invoices', to: '/finance/invoices', icon: FileText },
      { label: 'Vehicle P&L', to: '/finance/vehicle-pnl', icon: TrendingUp },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3 },
      { label: 'Analytics', to: '/analytics', icon: Activity },
      { label: 'Alerts', to: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', to: '/admin/users', icon: Users },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
      { label: 'Audit Trail', to: '/admin/audit', icon: History },
    ],
  },
];

import type { AuditEntry, User } from './types';

export const users: User[] = [
  { id: 'USR-01', name: 'Hassan Al Zaabi', email: 'hassan.alzaabi@momentumlogistics.com', role: 'Operations Director', department: 'Operations', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-20T13:40:00', avatarColor: '#0b475b' },
  { id: 'USR-02', name: 'Layla Haddad', email: 'layla.haddad@momentumlogistics.com', role: 'Dispatch Supervisor', department: 'Dispatch', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-20T10:15:00', avatarColor: '#1d5b72' },
  { id: 'USR-03', name: 'Sara Al Bloushi', email: 'sara.albloushi@momentumlogistics.com', role: 'Operations Coordinator', department: 'Operations', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-18T09:00:00', avatarColor: '#498eab' },
  { id: 'USR-04', name: 'Nour Al Amin', email: 'nour.alamin@momentumlogistics.com', role: 'Finance Manager', department: 'Finance', branch: 'Abu Dhabi Branch', status: 'Active', lastActive: '2026-08-20T08:05:00', avatarColor: '#007080' },
  { id: 'USR-05', name: 'Fahad Al Marri', email: 'fahad.almarri@momentumlogistics.com', role: 'Finance Officer', department: 'Finance', branch: 'Abu Dhabi Branch', status: 'Active', lastActive: '2026-08-19T10:40:00', avatarColor: '#0284C7' },
  { id: 'USR-06', name: 'Mona Al Suwaidi', email: 'mona.alsuwaidi@momentumlogistics.com', role: 'Fleet Manager', department: 'Fleet & Maintenance', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-20T07:15:00', avatarColor: '#B45309' },
  { id: 'USR-07', name: 'Tariq Al Jaberi', email: 'tariq.aljaberi@momentumlogistics.com', role: 'Maintenance Planner', department: 'Fleet & Maintenance', branch: 'Abu Dhabi Branch', status: 'Active', lastActive: '2026-08-19T17:30:00', avatarColor: '#C2410C' },
  { id: 'USR-08', name: 'Reem Al Kaabi', email: 'reem.alkaabi@momentumlogistics.com', role: 'Customer Success Lead', department: 'Commercial', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-18T14:00:00', avatarColor: '#7C3AED' },
  { id: 'USR-09', name: 'Ibrahim Al Falasi', email: 'ibrahim.alfalasi@momentumlogistics.com', role: 'HSE Officer', department: 'Compliance', branch: 'Dubai HQ', status: 'Inactive', lastActive: '2026-07-30T09:00:00', avatarColor: '#64748B' },
  { id: 'USR-10', name: 'Dana Al Mansoori', email: 'dana.almansoori@momentumlogistics.com', role: 'IT Systems Admin', department: 'IT', branch: 'Dubai HQ', status: 'Active', lastActive: '2026-08-20T11:00:00', avatarColor: '#0F766E' },
  { id: 'USR-11', name: 'Yousef Al Hammadi', email: 'yousef.alhammadi@momentumlogistics.com', role: 'Regional Manager — KSA', department: 'Operations', branch: 'Riyadh Branch', status: 'Invited', lastActive: '—', avatarColor: '#475569' },
  { id: 'USR-12', name: 'Aisha Al Nuaimi', email: 'aisha.alnuaimi@momentumlogistics.com', role: 'Payroll & HR Officer', department: 'Human Resources', branch: 'Dubai HQ', status: 'Suspended', lastActive: '2026-07-02T09:00:00', avatarColor: '#9F1239' },
];

export const roles = [
  { name: 'Operations Director', users: 1, permissions: 'Full access' },
  { name: 'Dispatch Supervisor', users: 1, permissions: 'Operations module (full), Fleet (view)' },
  { name: 'Operations Coordinator', users: 1, permissions: 'RRR & Jobs (create/edit), Trips (view)' },
  { name: 'Finance Manager', users: 1, permissions: 'Finance module (full), Reports (full)' },
  { name: 'Finance Officer', users: 1, permissions: 'Finance module (edit), Reports (view)' },
  { name: 'Fleet Manager', users: 1, permissions: 'Fleet & Maintenance (full)' },
  { name: 'Maintenance Planner', users: 1, permissions: 'Maintenance & Parts (edit)' },
  { name: 'Customer Success Lead', users: 1, permissions: 'RRR & Billing (view), Customers (edit)' },
  { name: 'Read-only Viewer', users: 0, permissions: 'All modules (view only)' },
];

export const permissionMatrix = {
  modules: ['RRR', 'Jobs', 'Dispatch', 'Trips', 'Fleet', 'Maintenance', 'Finance', 'Reports', 'Administration'],
  roles: [
    { role: 'Operations Director', access: { RRR: 'full', Jobs: 'full', Dispatch: 'full', Trips: 'full', Fleet: 'full', Maintenance: 'full', Finance: 'full', Reports: 'full', Administration: 'full' } },
    { role: 'Dispatch Supervisor', access: { RRR: 'edit', Jobs: 'full', Dispatch: 'full', Trips: 'edit', Fleet: 'view', Maintenance: 'view', Finance: 'none', Reports: 'view', Administration: 'none' } },
    { role: 'Finance Manager', access: { RRR: 'view', Jobs: 'view', Dispatch: 'none', Trips: 'view', Fleet: 'view', Maintenance: 'view', Finance: 'full', Reports: 'full', Administration: 'none' } },
    { role: 'Fleet Manager', access: { RRR: 'none', Jobs: 'view', Dispatch: 'view', Trips: 'view', Fleet: 'full', Maintenance: 'full', Finance: 'view', Reports: 'view', Administration: 'none' } },
    { role: 'Read-only Viewer', access: { RRR: 'view', Jobs: 'view', Dispatch: 'view', Trips: 'view', Fleet: 'view', Maintenance: 'view', Finance: 'view', Reports: 'view', Administration: 'none' } },
  ] as { role: string; access: Record<string, 'full' | 'edit' | 'view' | 'none'> }[],
};

export const auditTrail: AuditEntry[] = [
  { id: 'AUD-9001', user: 'Hassan Al Zaabi', action: 'Approved', entity: 'RRR-2026-0135', previousValue: 'Submitted', newValue: 'Approved', timestamp: '2026-08-16T15:10:00' },
  { id: 'AUD-9002', user: 'Layla Haddad', action: 'Assigned Vehicle', entity: 'JOB-2026-0090', previousValue: 'Unassigned', newValue: 'VEH-105 / DRV-205', timestamp: '2026-08-19T09:50:00' },
  { id: 'AUD-9003', user: 'Nour Al Amin', action: 'Status Change', entity: 'INV-2026-1201', previousValue: 'Sent', newValue: 'Paid', timestamp: '2026-08-19T11:20:00' },
  { id: 'AUD-9004', user: 'Fahad Al Marri', action: 'Approved', entity: 'EX-2026-8801', previousValue: 'Pending', newValue: 'Approved', timestamp: '2026-08-19T10:40:00' },
  { id: 'AUD-9005', user: 'System', action: 'Status Change', entity: 'TRP-2026-0201', previousValue: 'Verified', newValue: 'Financially Closed', timestamp: '2026-08-19T11:15:00' },
  { id: 'AUD-9006', user: 'Mona Al Suwaidi', action: 'Updated', entity: 'VEH-111', previousValue: 'Odometer: 197,900', newValue: 'Odometer: 198,760', timestamp: '2026-08-14T08:30:00' },
  { id: 'AUD-9007', user: 'Dana Al Mansoori', action: 'Role Change', entity: 'USR-11', previousValue: 'No Role', newValue: 'Regional Manager — KSA', timestamp: '2026-08-13T14:00:00' },
  { id: 'AUD-9008', user: 'Tariq Al Jaberi', action: 'Status Change', entity: 'WO-2026-3298', previousValue: 'In Progress', newValue: 'Awaiting Parts', timestamp: '2026-08-10T16:45:00' },
  { id: 'AUD-9009', user: 'Reem Al Kaabi', action: 'Updated', entity: 'CUS-006', previousValue: 'Credit Limit: AED 400,000', newValue: 'Credit Limit: AED 450,000', timestamp: '2026-08-05T10:20:00' },
  { id: 'AUD-9010', user: 'Dana Al Mansoori', action: 'Suspended', entity: 'USR-12', previousValue: 'Active', newValue: 'Suspended', timestamp: '2026-07-02T09:15:00' },
];

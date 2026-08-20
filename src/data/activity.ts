import type { ActivityItem } from './types';

export const activityFeed: ActivityItem[] = [
  { id: 'ACT-001', actor: 'Hassan Al Zaabi', action: 'approved RRR', entity: 'RRR-2026-0135', module: 'RRR', timestamp: '2026-08-20T13:40:00' },
  { id: 'ACT-002', actor: 'System', action: 'flagged trip as delayed', entity: 'TRP-2026-0203', module: 'Trips', timestamp: '2026-08-20T13:05:00' },
  { id: 'ACT-003', actor: 'Layla Haddad', action: 'dispatched job', entity: 'JOB-2026-0088', module: 'Dispatch', timestamp: '2026-08-20T10:15:00' },
  { id: 'ACT-004', actor: 'Layla Haddad', action: 'dispatched job', entity: 'JOB-2026-0087', module: 'Dispatch', timestamp: '2026-08-20T09:00:00' },
  { id: 'ACT-005', actor: 'Mohammed Al Rashid', action: 'submitted fuel voucher', entity: 'FV-2026-5524', module: 'Fuel', timestamp: '2026-08-20T08:20:00' },
  { id: 'ACT-006', actor: 'System', action: 'generated critical alert', entity: 'VEH-107', module: 'Fleet', timestamp: '2026-08-20T09:10:00' },
  { id: 'ACT-007', actor: 'Nour Al Amin', action: 'created invoice', entity: 'INV-2026-1210', module: 'Billing', timestamp: '2026-08-20T08:05:00' },
  { id: 'ACT-008', actor: 'Hassan Al Zaabi', action: 'approved RRR', entity: 'RRR-2026-0136', module: 'RRR', timestamp: '2026-08-16T15:10:00' },
  { id: 'ACT-009', actor: 'Sara Al Bloushi', action: 'created RRR', entity: 'RRR-2026-0141', module: 'RRR', timestamp: '2026-08-18T09:00:00' },
  { id: 'ACT-010', actor: 'Workshop — Central', action: 'updated work order', entity: 'WO-2026-3301', module: 'Maintenance', timestamp: '2026-08-19T17:30:00' },
  { id: 'ACT-011', actor: 'Nour Al Amin', action: 'marked invoice paid', entity: 'INV-2026-1201', module: 'Billing', timestamp: '2026-08-19T11:20:00' },
  { id: 'ACT-012', actor: 'System', action: 'closed trip financially', entity: 'TRP-2026-0201', module: 'Trips', timestamp: '2026-08-19T11:15:00' },
  { id: 'ACT-013', actor: 'Fahad Al Marri', action: 'approved expense voucher', entity: 'EX-2026-8801', module: 'Expenses', timestamp: '2026-08-19T10:40:00' },
  { id: 'ACT-014', actor: 'Layla Haddad', action: 'assigned vehicle to job', entity: 'JOB-2026-0090', module: 'Dispatch', timestamp: '2026-08-19T09:50:00' },
  { id: 'ACT-015', actor: 'Ahmed Hassan Ali', action: 'completed pre-trip inspection', entity: 'VEH-103', module: 'Fleet', timestamp: '2026-08-19T07:15:00' },
];

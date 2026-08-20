import type { AlertItem } from './types';

export const alerts: AlertItem[] = [
  { id: 'ALT-001', severity: 'Critical', module: 'Fleet', title: 'Tracker offline', description: 'VEH-107 (MLX-107) has been offline for 6h 40m — last known location RAK Quarry Yard', entity: 'VEH-107', timestamp: '2026-08-20T09:10:00', read: false },
  { id: 'ALT-002', severity: 'Critical', module: 'Finance', title: 'Expense above limit', description: 'EX-2026-8750 toll reconciliation of AED 890 exceeds the AED 300 route average threshold', entity: 'EX-2026-8750', timestamp: '2026-08-20T07:45:00', read: false },
  { id: 'ALT-003', severity: 'High', module: 'Maintenance', title: 'Vehicle maintenance due', description: 'VEH-104 (MLX-104) is due for scheduled service in 3 days / 890km', entity: 'VEH-104', timestamp: '2026-08-20T06:00:00', read: false },
  { id: 'ALT-004', severity: 'High', module: 'Fleet', title: 'Document expiring', description: "VEH-107 registration expires in 12 days — renewal required", entity: 'VEH-107', timestamp: '2026-08-19T16:20:00', read: false },
  { id: 'ALT-005', severity: 'High', module: 'Dispatch', title: 'Trip delayed', description: 'TRP-2026-0203 running 45 min behind ETA due to checkpoint congestion near Dammam', entity: 'TRP-2026-0203', timestamp: '2026-08-20T13:05:00', read: false },
  { id: 'ALT-006', severity: 'Medium', module: 'RRR', title: 'RRR pending approval', description: '2 requisitions awaiting approval for over 24 hours', entity: 'RRR-2026-0141', timestamp: '2026-08-19T11:30:00', read: true },
  { id: 'ALT-007', severity: 'Medium', module: 'Jobs', title: 'Job awaiting assignment', description: 'JOB-2026-0091 has no vehicle/driver assigned, required in 4 days', entity: 'JOB-2026-0091', timestamp: '2026-08-19T09:15:00', read: true },
  { id: 'ALT-008', severity: 'Medium', module: 'Fleet', title: 'Excessive idling detected', description: 'VEH-105 idled for 2h 15m at Al Ain Industrial Yard outside scheduled stop', entity: 'VEH-105', timestamp: '2026-08-19T14:40:00', read: true },
  { id: 'ALT-009', severity: 'Medium', module: 'Finance', title: 'Fuel anomaly', description: 'FV-2026-5502 litres logged (340L) exceeds tank capacity for MLX-102 by 15%', entity: 'FV-2026-5502', timestamp: '2026-08-06T18:00:00', read: true },
  { id: 'ALT-010', severity: 'Low', module: 'Finance', title: 'Invoice pending approval', description: 'INV-2026-1202 pending finance approval, due in 30 days', entity: 'INV-2026-1202', timestamp: '2026-08-19T10:00:00', read: true },
  { id: 'ALT-011', severity: 'Low', module: 'Trips', title: 'Trip missing information', description: 'TRP-2026-0207 missing fuel voucher after dispatch', entity: 'TRP-2026-0207', timestamp: '2026-08-20T09:30:00', read: false },
  { id: 'ALT-012', severity: 'Medium', module: 'Fleet', title: 'Vehicle outside expected route', description: 'VEH-110 deviated 8km from planned route near Al Ain checkpoint', entity: 'VEH-110', timestamp: '2026-08-20T04:20:00', read: true },
  { id: 'ALT-013', severity: 'High', module: 'Maintenance', title: 'Parts stock critical', description: 'Fuel Filter (PT-004) stock at 9 units, below minimum threshold of 20', entity: 'PT-004', timestamp: '2026-08-18T08:00:00', read: true },
  { id: 'ALT-014', severity: 'Low', module: 'Drivers', title: 'License expiring soon', description: "Bilal Ahmed Sheikh's license expires in 9 months — renewal reminder sent", entity: 'DRV-211', timestamp: '2026-08-17T12:00:00', read: true },
];

export function unreadAlertCount() {
  return alerts.filter((a) => !a.read).length;
}

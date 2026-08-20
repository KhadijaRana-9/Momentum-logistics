import type { Job } from './types';

export const jobs: Job[] = [
  { id: 'JOB-2026-0091', rrrId: 'RRR-2026-0146', customerId: 'CUS-006', route: 'Dubai → Abu Dhabi', scheduledDate: '2026-08-24', status: 'New', billingStatus: 'Not Billed', revenue: 6300 },
  { id: 'JOB-2026-0092', rrrId: 'RRR-2026-0147', customerId: 'CUS-010', route: 'Sharjah → Dubai', scheduledDate: '2026-08-23', status: 'Ready', billingStatus: 'Not Billed', revenue: 7800 },
  { id: 'JOB-2026-0089', rrrId: 'RRR-2026-0144', customerId: 'CUS-002', vehicleId: 'VEH-103', driverId: 'DRV-203', route: 'Abu Dhabi → Sharjah', scheduledDate: '2026-08-23', status: 'Assigned', billingStatus: 'Not Billed', revenue: 8900 },
  { id: 'JOB-2026-0090', rrrId: 'RRR-2026-0145', customerId: 'CUS-009', vehicleId: 'VEH-105', driverId: 'DRV-205', route: 'Sharjah → Jebel Ali', scheduledDate: '2026-08-23', status: 'Assigned', billingStatus: 'Not Billed', revenue: 15400 },
  { id: 'JOB-2026-0087', rrrId: 'RRR-2026-0119', customerId: 'CUS-001', vehicleId: 'VEH-102', driverId: 'DRV-202', route: 'Dubai → Riyadh', scheduledDate: '2026-08-20', status: 'Dispatched', tripId: 'TRP-2026-0207', billingStatus: 'Not Billed', revenue: 11200 },
  { id: 'JOB-2026-0088', rrrId: 'RRR-2026-0120', customerId: 'CUS-007', vehicleId: 'VEH-108', driverId: 'DRV-208', route: 'Doha → Jebel Ali', scheduledDate: '2026-08-20', status: 'Dispatched', tripId: 'TRP-2026-0208', billingStatus: 'Not Billed', revenue: 9700 },
  { id: 'JOB-2026-0081', rrrId: 'RRR-2026-0104', customerId: 'CUS-004', vehicleId: 'VEH-104', driverId: 'DRV-204', route: 'Riyadh → Dammam', scheduledDate: '2026-08-13', status: 'In Transit', tripId: 'TRP-2026-0203', billingStatus: 'Not Billed', revenue: 9800 },
  { id: 'JOB-2026-0082', rrrId: 'RRR-2026-0105', customerId: 'CUS-008', vehicleId: 'VEH-110', driverId: 'DRV-210', route: 'Muscat → Abu Dhabi', scheduledDate: '2026-08-13', status: 'In Transit', tripId: 'TRP-2026-0204', billingStatus: 'Not Billed', revenue: 7300 },
  { id: 'JOB-2026-0077', rrrId: 'RRR-2026-0098', customerId: 'CUS-012', vehicleId: 'VEH-109', driverId: 'DRV-209', route: 'Dubai → Sharjah', scheduledDate: '2026-08-11', status: 'Delivered', tripId: 'TRP-2026-0205', billingStatus: 'Pending', revenue: 5200 },
  { id: 'JOB-2026-0078', rrrId: 'RRR-2026-0099', customerId: 'CUS-003', vehicleId: 'VEH-107', driverId: 'DRV-207', route: 'Ras Al Khaimah → Dubai', scheduledDate: '2026-08-11', status: 'Delivered', tripId: 'TRP-2026-0206', billingStatus: 'Pending', revenue: 6100 },
  { id: 'JOB-2026-0074', rrrId: 'RRR-2026-0092', customerId: 'CUS-011', vehicleId: 'VEH-101', driverId: 'DRV-201', route: 'Abu Dhabi → Al Ain', scheduledDate: '2026-08-09', status: 'Trip Closed', tripId: 'TRP-2026-0202', billingStatus: 'Pending', revenue: 12600 },
  { id: 'JOB-2026-0073', rrrId: 'RRR-2026-0091', customerId: 'CUS-010', vehicleId: 'VEH-106', driverId: 'DRV-206', route: 'Sharjah → Kuwait City', scheduledDate: '2026-08-09', status: 'Invoiced', tripId: 'TRP-2026-0201', billingStatus: 'Invoiced', revenue: 8400 },
];

export function getJob(id: string) {
  return jobs.find((j) => j.id === id);
}

export const JOB_BOARD_COLUMNS = ['New', 'Ready', 'Assigned', 'Dispatched', 'In Transit', 'Delivered', 'Trip Closed', 'Invoiced'] as const;

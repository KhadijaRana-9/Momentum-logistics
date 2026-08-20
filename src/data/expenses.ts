import type { ExpenseVoucher } from './types';

export const expenseVouchers: ExpenseVoucher[] = [
  { id: 'EX-2026-8801', category: 'Tolls & Parking', tripId: 'TRP-2026-0201', driverId: 'DRV-206', vehicleId: 'VEH-106', amount: 120, date: '2026-08-09', description: 'Salik & border toll crossing, Sharjah–Kuwait corridor', receiptAttached: true, approvalStatus: 'Approved' },
  { id: 'EX-2026-8802', category: 'Driver Meals', tripId: 'TRP-2026-0201', driverId: 'DRV-206', vehicleId: 'VEH-106', amount: 90, date: '2026-08-09', description: 'Meal allowance — 2 day trip', receiptAttached: true, approvalStatus: 'Approved' },
  { id: 'EX-2026-8803', category: 'Loading/Unloading', tripId: 'TRP-2026-0202', driverId: 'DRV-201', vehicleId: 'VEH-101', amount: 180, date: '2026-08-09', description: 'Crane offload labour, Masdar City site', receiptAttached: true, approvalStatus: 'Approved' },
  { id: 'EX-2026-8810', category: 'Tolls & Parking', tripId: 'TRP-2026-0203', driverId: 'DRV-204', vehicleId: 'VEH-104', amount: 40, date: '2026-08-20', description: 'Highway toll, Riyadh–Dammam', receiptAttached: false, approvalStatus: 'Pending' },
  { id: 'EX-2026-8811', category: 'Driver Meals', tripId: 'TRP-2026-0204', driverId: 'DRV-210', vehicleId: 'VEH-110', amount: 25, date: '2026-08-20', description: 'Meal allowance', receiptAttached: true, approvalStatus: 'Pending' },
  { id: 'EX-2026-8760', category: 'Vehicle Wash', driverId: 'DRV-202', vehicleId: 'VEH-102', amount: 45, date: '2026-08-18', description: 'Exterior wash before Riyadh dispatch', receiptAttached: true, approvalStatus: 'Approved' },
  { id: 'EX-2026-8761', category: 'Miscellaneous', driverId: 'DRV-208', vehicleId: 'VEH-108', amount: 620, date: '2026-08-17', description: 'Emergency roadside tyre repair, Doha bypass', receiptAttached: true, approvalStatus: 'Approved', flagged: true },
  { id: 'EX-2026-8755', category: 'Driver Advance', driverId: 'DRV-205', amount: 1500, date: '2026-08-15', description: 'Trip advance — Jubail tanker run', receiptAttached: false, approvalStatus: 'Approved' },
  { id: 'EX-2026-8750', category: 'Tolls & Parking', driverId: 'DRV-207', vehicleId: 'VEH-107', amount: 890, date: '2026-08-14', description: 'Monthly toll reconciliation exceeds route average', receiptAttached: true, approvalStatus: 'Pending', flagged: true },
  { id: 'EX-2026-8744', category: 'Loading/Unloading', driverId: 'DRV-203', vehicleId: 'VEH-103', amount: 95, date: '2026-08-12', description: 'Store dock labour charge', receiptAttached: true, approvalStatus: 'Reimbursed' },
  { id: 'EX-2026-8730', category: 'Miscellaneous', driverId: 'DRV-209', vehicleId: 'VEH-109', amount: 60, date: '2026-08-11', description: 'Weighbridge ticket fee', receiptAttached: true, approvalStatus: 'Reimbursed' },
  { id: 'EX-2026-8712', category: 'Driver Meals', driverId: 'DRV-212', amount: 340, date: '2026-08-08', description: 'Meal claims — no receipts for 3 of 5 days', receiptAttached: false, approvalStatus: 'Rejected', flagged: true },
];

export function getExpenseVoucher(id: string) {
  return expenseVouchers.find((e) => e.id === id);
}

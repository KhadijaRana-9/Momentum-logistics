import type { Tyre } from './types';

export const tyres: Tyre[] = [
  { id: 'TY-001', brand: 'Michelin X Multi', size: '295/80R22.5', serial: 'MX-77201', vehicleId: 'VEH-101', position: 'Front Left', installKm: 160000, removalKm: null, treadDepth: 9.2, cost: 1180, status: 'In Service' },
  { id: 'TY-002', brand: 'Michelin X Multi', size: '295/80R22.5', serial: 'MX-77202', vehicleId: 'VEH-101', position: 'Front Right', installKm: 160000, removalKm: null, treadDepth: 9.0, cost: 1180, status: 'In Service' },
  { id: 'TY-003', brand: 'Bridgestone M-Drive', size: '295/80R22.5', serial: 'BS-40911', vehicleId: 'VEH-102', position: 'Rear Left Outer', installKm: 180000, removalKm: null, treadDepth: 6.4, cost: 1050, status: 'In Service' },
  { id: 'TY-004', brand: 'Bridgestone M-Drive', size: '295/80R22.5', serial: 'BS-40912', vehicleId: 'VEH-102', position: 'Rear Left Inner', installKm: 180000, removalKm: null, treadDepth: 6.1, cost: 1050, status: 'In Service' },
  { id: 'TY-005', brand: 'Continental HDR2', size: '315/80R22.5', serial: 'CT-58820', vehicleId: 'VEH-104', position: 'Front Left', installKm: 275000, removalKm: null, treadDepth: 3.1, cost: 1240, status: 'In Service' },
  { id: 'TY-006', brand: 'Continental HDR2', size: '315/80R22.5', serial: 'CT-58821', vehicleId: 'VEH-104', position: 'Front Right', installKm: 275000, removalKm: null, treadDepth: 2.8, cost: 1240, status: 'In Service' },
  { id: 'TY-007', brand: 'Michelin X Multi', size: '295/80R22.5', serial: 'MX-71145', vehicleId: 'VEH-106', position: 'Rear Right Outer', installKm: 310000, removalKm: 349000, treadDepth: 1.2, cost: 1180, status: 'Scrapped', replacementReason: 'Tread below legal limit (1.6mm)' },
  { id: 'TY-008', brand: 'Yokohama TY577', size: '295/80R22.5', serial: 'YK-33087', vehicleId: 'VEH-106', position: 'Rear Right Outer', installKm: 349000, removalKm: null, treadDepth: 10.0, cost: 990, status: 'In Service' },
  { id: 'TY-009', brand: 'Bridgestone M-Drive', size: '385/65R22.5', serial: 'BS-29104', vehicleId: 'VEH-105', position: 'Front Left', installKm: 95000, removalKm: null, treadDepth: 5.5, cost: 1420, status: 'In Service' },
  { id: 'TY-010', brand: 'Continental HDR2', size: '315/80R22.5', serial: 'CT-60218', vehicleId: null, position: 'Warehouse', installKm: 0, removalKm: null, treadDepth: 14.0, cost: 1240, status: 'In Stock' },
  { id: 'TY-011', brand: 'Continental HDR2', size: '315/80R22.5', serial: 'CT-60219', vehicleId: null, position: 'Warehouse', installKm: 0, removalKm: null, treadDepth: 14.0, cost: 1240, status: 'In Stock' },
  { id: 'TY-012', brand: 'Michelin X Multi', size: '295/80R22.5', serial: 'MX-65590', vehicleId: 'VEH-107', position: 'Rear Left Outer', installKm: 120000, removalKm: 178000, treadDepth: 5.8, cost: 1180, status: 'Retreaded', replacementReason: 'Sidewall puncture, sent for retread' },
];

export function getTyre(id: string) {
  return tyres.find((t) => t.id === id);
}

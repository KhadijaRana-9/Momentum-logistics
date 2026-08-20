import type { Part } from './types';

export const parts: Part[] = [
  { id: 'PT-001', name: 'Engine Oil 15W-40 (20L Drum)', category: 'Lubricants', sku: 'LUB-1540-20', stock: 42, minStock: 20, unitCost: 340, supplier: 'Emarat Lubricants Trading', status: 'Healthy' },
  { id: 'PT-002', name: 'Oil Filter — Heavy Duty', category: 'Filters', sku: 'FLT-OIL-HD', stock: 18, minStock: 25, unitCost: 65, supplier: 'Al Bahar Filters Co.', status: 'Low' },
  { id: 'PT-003', name: 'Air Filter — Cabin', category: 'Filters', sku: 'FLT-AIR-CB', stock: 31, minStock: 15, unitCost: 120, supplier: 'Al Bahar Filters Co.', status: 'Healthy' },
  { id: 'PT-004', name: 'Fuel Filter', category: 'Filters', sku: 'FLT-FUEL-01', stock: 9, minStock: 20, unitCost: 95, supplier: 'Al Bahar Filters Co.', status: 'Critical' },
  { id: 'PT-005', name: 'Brake Pad Set — Front Axle', category: 'Brakes', sku: 'BRK-PAD-FR', stock: 14, minStock: 10, unitCost: 285, supplier: 'Gulf Brake Systems', status: 'Healthy' },
  { id: 'PT-006', name: 'Brake Pad Set — Rear Axle', category: 'Brakes', sku: 'BRK-PAD-RR', stock: 6, minStock: 10, unitCost: 310, supplier: 'Gulf Brake Systems', status: 'Low' },
  { id: 'PT-007', name: 'Compressor Clutch Assembly', category: 'Refrigeration', sku: 'REF-CMP-CL', stock: 2, minStock: 4, unitCost: 2100, supplier: 'Thermo King Gulf', status: 'Critical' },
  { id: 'PT-008', name: 'R-404A Refrigerant (10kg Cylinder)', category: 'Refrigeration', sku: 'REF-R404A', stock: 5, minStock: 6, unitCost: 480, supplier: 'Thermo King Gulf', status: 'Low' },
  { id: 'PT-009', name: 'GPS Antenna + Cable Kit', category: 'Electronics', sku: 'TRK-ANT-01', stock: 11, minStock: 8, unitCost: 210, supplier: 'FleetTrace Solutions', status: 'Healthy' },
  { id: 'PT-010', name: 'Windshield Wiper Blade Set', category: 'Body & Cabin', sku: 'CAB-WPR-SET', stock: 27, minStock: 12, unitCost: 55, supplier: 'Al Bahar Filters Co.', status: 'Healthy' },
  { id: 'PT-011', name: 'Alternator — 24V Heavy Duty', category: 'Electrical', sku: 'ELC-ALT-24V', stock: 0, minStock: 3, unitCost: 1450, supplier: 'Bosch Fleet Parts', status: 'Out of Stock' },
  { id: 'PT-012', name: 'Marine Grease (5kg Tub)', category: 'Lubricants', sku: 'LUB-GRS-5K', stock: 22, minStock: 10, unitCost: 85, supplier: 'Emarat Lubricants Trading', status: 'Healthy' },
  { id: 'PT-013', name: 'Turbocharger Assembly', category: 'Engine', sku: 'ENG-TRB-01', stock: 3, minStock: 2, unitCost: 3200, supplier: 'Bosch Fleet Parts', status: 'Healthy' },
  { id: 'PT-014', name: 'Coolant — Long Life (20L)', category: 'Lubricants', sku: 'LUB-COOL-20', stock: 16, minStock: 12, unitCost: 130, supplier: 'Emarat Lubricants Trading', status: 'Healthy' },
];

export function getPart(id: string) {
  return parts.find((p) => p.id === id);
}

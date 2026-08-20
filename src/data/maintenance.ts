import type { MaintenanceOrder } from './types';

export const maintenanceOrders: MaintenanceOrder[] = [
  {
    id: 'WO-2026-3301', vehicleId: 'VEH-111', workshopId: 'WS-01', category: 'Preventive',
    problem: '20,000km scheduled service', diagnosis: 'Oil, filters, and brake pad wear within service interval',
    workPerformed: 'Full oil & filter change, brake pad inspection, coolant top-up, 42-point inspection',
    parts: [ { name: 'Engine Oil 15W-40 (20L)', qty: 1, cost: 340 }, { name: 'Oil Filter', qty: 1, cost: 65 }, { name: 'Air Filter', qty: 1, cost: 120 } ],
    labourCost: 450, startDate: '2026-08-14', endDate: null, warranty: '6 months / 15,000km', status: 'In Progress', odometer: 198760,
  },
  {
    id: 'WO-2026-3298', vehicleId: 'VEH-112', workshopId: 'WS-02', category: 'Repair',
    problem: 'Refrigeration unit not maintaining temperature', diagnosis: 'Compressor clutch failure, refrigerant undercharge',
    workPerformed: 'Compressor clutch replacement, refrigerant recharge, system pressure test',
    parts: [ { name: 'Compressor Clutch Assembly', qty: 1, cost: 2100 }, { name: 'R-404A Refrigerant (10kg)', qty: 1, cost: 480 } ],
    labourCost: 950, startDate: '2026-08-10', endDate: null, warranty: '12 months', status: 'Awaiting Parts', odometer: 412990,
  },
  {
    id: 'WO-2026-3295', vehicleId: 'VEH-107', workshopId: 'WS-04', category: 'Repair',
    problem: 'Tracker unit offline, no GPS signal', diagnosis: 'GPS antenna cable damaged, unit powering on but no fix',
    workPerformed: 'Antenna cable replacement, firmware reflash, signal test',
    parts: [ { name: 'GPS Antenna + Cable', qty: 1, cost: 210 } ],
    labourCost: 180, startDate: '2026-08-18', endDate: null, warranty: '3 months', status: 'Scheduled', odometer: 178540,
  },
  {
    id: 'WO-2026-3288', vehicleId: 'VEH-105', workshopId: 'WS-05', category: 'Inspection',
    problem: 'Tanker pressure relief valve certification due', diagnosis: 'Annual ADR pressure vessel inspection required',
    workPerformed: 'Valve testing, calibration, certification renewal',
    parts: [], labourCost: 620, startDate: '2026-08-05', endDate: '2026-08-06', warranty: '—', status: 'Completed', odometer: 141800,
  },
  {
    id: 'WO-2026-3271', vehicleId: 'VEH-103', workshopId: 'WS-02', category: 'Preventive',
    problem: '90,000km scheduled service', diagnosis: 'Routine interval maintenance',
    workPerformed: 'Oil & filter change, transmission fluid check, wheel alignment',
    parts: [ { name: 'Engine Oil 15W-40 (20L)', qty: 1, cost: 340 }, { name: 'Oil Filter', qty: 1, cost: 65 }, { name: 'Fuel Filter', qty: 1, cost: 95 } ],
    labourCost: 380, startDate: '2026-07-28', endDate: '2026-07-29', warranty: '6 months / 15,000km', status: 'Completed', odometer: 95600,
  },
  {
    id: 'WO-2026-3260', vehicleId: 'VEH-106', workshopId: 'WS-01', category: 'Repair',
    problem: 'Trailer landing gear stiff / hard to crank', diagnosis: 'Gearbox lubrication dried out, minor corrosion',
    workPerformed: 'Landing gear gearbox service, corrosion treatment, grease repack',
    parts: [ { name: 'Marine Grease (5kg)', qty: 1, cost: 85 } ],
    labourCost: 210, startDate: '2026-07-20', endDate: '2026-07-20', warranty: '3 months', status: 'Completed', odometer: 349200,
  },
  {
    id: 'WO-2026-3245', vehicleId: 'VEH-109', workshopId: 'WS-06', category: 'Accident',
    problem: 'Rear bumper and mudguard damage from loading dock incident', diagnosis: 'Bent rear bumper bracket, cracked mudguard',
    workPerformed: 'Bumper bracket straightened & reinforced, mudguard replaced, repaint',
    parts: [ { name: 'Mudguard Assembly', qty: 2, cost: 260 }, { name: 'Touch-up Paint Kit', qty: 1, cost: 90 } ],
    labourCost: 340, startDate: '2026-07-10', endDate: '2026-07-12', warranty: '6 months', status: 'Completed', odometer: 219400,
  },
];

export function getMaintenanceOrder(id: string) {
  return maintenanceOrders.find((m) => m.id === id);
}

export function maintenanceCost(m: MaintenanceOrder) {
  return m.labourCost + m.parts.reduce((sum, p) => sum + p.cost * p.qty, 0);
}

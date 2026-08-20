import type { Trip } from './types';

export const trips: Trip[] = [
  {
    id: 'TRP-2026-0201', jobId: 'JOB-2026-0073', rrrId: 'RRR-2026-0091', vehicleId: 'VEH-106', driverId: 'DRV-206', customerId: 'CUS-010',
    route: 'Sharjah → Kuwait City', startTime: '2026-08-09T06:00:00', endTime: '2026-08-10T14:30:00',
    startLocation: 'Union Coop DC, Sharjah', endLocation: 'Union Coop Branch, Kuwait City',
    startOdometer: 355700, endOdometer: 356710, distance: 1010, fuelLitres: 316, fuelCost: 980,
    tolls: 120, meals: 90, loadingCharges: 250, miscExpenses: 60, incentives: 150, advance: 500,
    revenue: 8400, status: 'Financially Closed',
  },
  {
    id: 'TRP-2026-0202', jobId: 'JOB-2026-0074', rrrId: 'RRR-2026-0092', vehicleId: 'VEH-101', driverId: 'DRV-201', customerId: 'CUS-011',
    route: 'Abu Dhabi → Al Ain', startTime: '2026-08-09T07:15:00', endTime: '2026-08-09T11:40:00',
    startLocation: 'Masdar Supplier Yard, Abu Dhabi', endLocation: 'Masdar City Construction Site',
    startOdometer: 181800, endOdometer: 181960, distance: 160, fuelLitres: 50, fuelCost: 155,
    tolls: 20, meals: 30, loadingCharges: 180, miscExpenses: 20, incentives: 0, advance: 300,
    revenue: 12600, status: 'Verified',
  },
  {
    id: 'TRP-2026-0203', jobId: 'JOB-2026-0081', rrrId: 'RRR-2026-0104', vehicleId: 'VEH-104', driverId: 'DRV-204', customerId: 'CUS-004',
    route: 'Riyadh → Dammam', startTime: '2026-08-20T05:30:00', endTime: null,
    startLocation: 'Almarai Dairy Plant, Riyadh', endLocation: 'Regional DC, Dammam',
    startOdometer: 301580, endOdometer: null, distance: 400, fuelLitres: 80, fuelCost: 248,
    tolls: 40, meals: 30, loadingCharges: 150, miscExpenses: 20, incentives: 0, advance: 400,
    revenue: 9800, status: 'In Transit', eta: '2026-08-20T16:30:00',
  },
  {
    id: 'TRP-2026-0204', jobId: 'JOB-2026-0082', rrrId: 'RRR-2026-0105', vehicleId: 'VEH-110', driverId: 'DRV-210', customerId: 'CUS-008',
    route: 'Muscat → Abu Dhabi', startTime: '2026-08-20T02:00:00', endTime: null,
    startLocation: 'Oman Cables Plant, Muscat', endLocation: 'Abu Dhabi Distribution Yard',
    startOdometer: 111850, endOdometer: null, distance: 480, fuelLitres: 95, fuelCost: 295,
    tolls: 35, meals: 25, loadingCharges: 140, miscExpenses: 15, incentives: 0, advance: 350,
    revenue: 7300, status: 'In Transit', eta: '2026-08-20T20:00:00',
  },
  {
    id: 'TRP-2026-0205', jobId: 'JOB-2026-0077', rrrId: 'RRR-2026-0098', vehicleId: 'VEH-109', driverId: 'DRV-209', customerId: 'CUS-012',
    route: 'Dubai → Sharjah', startTime: '2026-08-11T08:00:00', endTime: '2026-08-11T09:10:00',
    startLocation: 'Nesto Central DC, Dubai', endLocation: 'Nesto Hypermarket, Sharjah',
    startOdometer: 224868, endOdometer: 224900, distance: 32, fuelLitres: 10, fuelCost: 31,
    tolls: 0, meals: 20, loadingCharges: 80, miscExpenses: 10, incentives: 0, advance: 0,
    revenue: 5200, status: 'Delivered',
  },
  {
    id: 'TRP-2026-0206', jobId: 'JOB-2026-0078', rrrId: 'RRR-2026-0099', vehicleId: 'VEH-107', driverId: 'DRV-207', customerId: 'CUS-003',
    route: 'Ras Al Khaimah → Dubai', startTime: '2026-08-11T06:20:00', endTime: '2026-08-11T09:45:00',
    startLocation: 'Gulf Cement Plant, Ras Al Khaimah', endLocation: 'Dubai Construction Site',
    startOdometer: 178430, endOdometer: 178540, distance: 110, fuelLitres: 34, fuelCost: 105,
    tolls: 15, meals: 25, loadingCharges: 60, miscExpenses: 10, incentives: 0, advance: 0,
    revenue: 6100, status: 'Delivered',
  },
  {
    id: 'TRP-2026-0207', jobId: 'JOB-2026-0087', rrrId: 'RRR-2026-0119', vehicleId: 'VEH-102', driverId: 'DRV-202', customerId: 'CUS-001',
    route: 'Dubai → Riyadh', startTime: '2026-08-20T09:00:00', endTime: null,
    startLocation: 'Al Futtaim DC, Dubai Investment Park', endLocation: 'Landmark Hub, Riyadh',
    startOdometer: 214870, endOdometer: null, distance: 950, fuelLitres: 0, fuelCost: 0,
    tolls: 0, meals: 0, loadingCharges: 250, miscExpenses: 0, incentives: 0, advance: 800,
    revenue: 11200, status: 'Dispatched', eta: '2026-08-24T18:00:00',
  },
  {
    id: 'TRP-2026-0208', jobId: 'JOB-2026-0088', rrrId: 'RRR-2026-0120', vehicleId: 'VEH-108', driverId: 'DRV-208', customerId: 'CUS-007',
    route: 'Doha → Jebel Ali', startTime: '2026-08-20T10:15:00', endTime: null,
    startLocation: 'Qatar Steel Plant, Doha', endLocation: 'Jebel Ali Port, Dubai',
    startOdometer: 68210, endOdometer: null, distance: 400, fuelLitres: 0, fuelCost: 0,
    tolls: 0, meals: 0, loadingCharges: 180, miscExpenses: 0, incentives: 0, advance: 600,
    revenue: 9700, status: 'Started', eta: '2026-08-21T10:00:00',
  },
];

export function getTrip(id: string | undefined) {
  return trips.find((t) => t.id === id);
}

export function tripCost(t: Trip) {
  return t.fuelCost + t.tolls + t.meals + t.loadingCharges + t.miscExpenses + t.incentives;
}

export function tripProfit(t: Trip) {
  return t.revenue - tripCost(t);
}

export const TRIP_STAGES = ['Created', 'Dispatched', 'Started', 'In Transit', 'Arrived', 'Delivered', 'Closed', 'Verified', 'Financially Closed'] as const;

export const kpis = {
  totalRevenue: { value: 4820600, delta: 8.4, trend: 'up' as const, period: 'vs last month' },
  activeTrips: { value: 27, delta: 12.5, trend: 'up' as const, period: 'vs last week' },
  activeVehicles: { value: 96, delta: 2.1, trend: 'up' as const, period: 'of 112 total' },
  vehicleUtilization: { value: 82.4, delta: -1.3, trend: 'down' as const, period: 'vs last month' },
  pendingRrrs: { value: 14, delta: 3, trend: 'up' as const, period: 'need action' },
  onTimeDelivery: { value: 94.2, delta: 1.8, trend: 'up' as const, period: 'vs last month' },
  fuelCost: { value: 386200, delta: 5.6, trend: 'up' as const, period: 'vs last month' },
  maintenanceCost: { value: 142800, delta: -4.2, trend: 'down' as const, period: 'vs last month' },
};

export const revenueTrend = [
  { period: 'W1', revenue: 890000, trips: 142, cost: 612000 },
  { period: 'W2', revenue: 945000, trips: 156, cost: 648000 },
  { period: 'W3', revenue: 1020000, trips: 168, cost: 690000 },
  { period: 'W4', revenue: 968000, trips: 149, cost: 671000 },
  { period: 'W5', revenue: 1084000, trips: 174, cost: 712000 },
  { period: 'W6', revenue: 1132000, trips: 181, cost: 738000 },
  { period: 'W7', revenue: 1076000, trips: 165, cost: 705000 },
  { period: 'W8', revenue: 1198000, trips: 189, cost: 758000 },
];

export const fleetUtilizationTrend = [
  { period: 'Mar', utilization: 76.2 },
  { period: 'Apr', utilization: 78.9 },
  { period: 'May', utilization: 80.1 },
  { period: 'Jun', utilization: 79.4 },
  { period: 'Jul', utilization: 83.7 },
  { period: 'Aug', utilization: 82.4 },
];

export const rrrPipeline = [
  { stage: 'Draft', count: 6 },
  { stage: 'Submitted', count: 9 },
  { stage: 'Approved', count: 7 },
  { stage: 'Assigned', count: 5 },
  { stage: 'Job Created', count: 11 },
  { stage: 'Dispatched', count: 8 },
  { stage: 'Completed', count: 34 },
];

export const tripStatusBreakdown = [
  { status: 'Created', count: 4 },
  { status: 'Dispatched', count: 6 },
  { status: 'In Transit', count: 12 },
  { status: 'Delivered', count: 9 },
  { status: 'Closed', count: 15 },
  { status: 'Delayed', count: 3 },
];

export const fleetLiveSummary = [
  { status: 'Moving', count: 58, tone: 'success' as const },
  { status: 'Idle', count: 24, tone: 'warning' as const },
  { status: 'Offline', count: 6, tone: 'neutral' as const },
  { status: 'Maintenance', count: 9, tone: 'orange' as const },
];

export const profitability = [
  { period: 'Mar', revenue: 3980000, cost: 2820000 },
  { period: 'Apr', revenue: 4120000, cost: 2890000 },
  { period: 'May', revenue: 4340000, cost: 3010000 },
  { period: 'Jun', revenue: 4260000, cost: 3040000 },
  { period: 'Jul', revenue: 4560000, cost: 3120000 },
  { period: 'Aug', revenue: 4820600, cost: 3266000 },
].map((d) => ({ ...d, profit: d.revenue - d.cost, margin: ((d.revenue - d.cost) / d.revenue) * 100 }));

export const costBreakdown = [
  { category: 'Fuel', value: 386200 },
  { category: 'Driver Costs', value: 298400 },
  { category: 'Maintenance', value: 142800 },
  { category: 'Tyres', value: 54200 },
  { category: 'Tolls & Misc', value: 38600 },
  { category: 'Insurance & Docs', value: 71300 },
];

export interface ReportDef {
  id: string;
  name: string;
  description: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  reports: ReportDef[];
}

export const reportCategories: ReportCategory[] = [
  {
    id: 'operations', name: 'Operations',
    reports: [
      { id: 'rrr-report', name: 'RRR Report', description: 'All requisitions with status, priority, and turnaround time' },
      { id: 'jobs-report', name: 'Jobs Report', description: 'Job volume, assignment lag, and completion rates' },
      { id: 'dispatch-report', name: 'Dispatch Report', description: 'Dispatch throughput and queue aging' },
      { id: 'trip-completion', name: 'Trip Completion', description: 'Completed trips vs. planned, on-time performance' },
      { id: 'active-trips', name: 'Active Trips', description: 'Live snapshot of all in-progress trips' },
      { id: 'delayed-trips', name: 'Delayed Trips', description: 'Trips exceeding planned ETA with delay reasons' },
      { id: 'vehicle-utilization', name: 'Vehicle Utilization', description: 'Utilization % by vehicle and vehicle type' },
      { id: 'driver-utilization', name: 'Driver Utilization', description: 'Trip load and idle time by driver' },
    ],
  },
  {
    id: 'fleet', name: 'Fleet',
    reports: [
      { id: 'vehicle-status', name: 'Vehicle Status', description: 'Current status of every unit in the fleet' },
      { id: 'vehicle-history', name: 'Vehicle History', description: 'Full trip and service history per vehicle' },
      { id: 'tracker-status', name: 'Tracker Status', description: 'GPS tracker connectivity and signal health' },
      { id: 'mileage', name: 'Mileage Report', description: 'Distance covered by vehicle and route' },
      { id: 'fuel-report', name: 'Fuel Report', description: 'Fuel consumption, cost, and efficiency by vehicle' },
      { id: 'operating-cost', name: 'Vehicle Operating Cost', description: 'All-in cost per vehicle including fuel, maintenance, tyres' },
    ],
  },
  {
    id: 'maintenance', name: 'Maintenance',
    reports: [
      { id: 'pm-due', name: 'PM Due', description: 'Vehicles approaching preventive maintenance interval' },
      { id: 'maintenance-history', name: 'Maintenance History', description: 'Work order history across the fleet' },
      { id: 'workshop-workload', name: 'Workshop Workload', description: 'Active and completed jobs per workshop' },
      { id: 'repair-cost', name: 'Repair Cost', description: 'Repair cost trend by vehicle and category' },
      { id: 'parts-consumption', name: 'Parts Consumption', description: 'Parts usage rate and reorder recommendations' },
      { id: 'tyre-lifecycle', name: 'Tyre Lifecycle', description: 'Tyre install/removal history and cost per km' },
    ],
  },
  {
    id: 'finance', name: 'Finance',
    reports: [
      { id: 'revenue-report', name: 'Revenue Report', description: 'Revenue by customer, route, and contract' },
      { id: 'expenses-report', name: 'Expenses Report', description: 'Operating expenses by category and approval status' },
      { id: 'customer-balances', name: 'Customer Balances', description: 'Outstanding balances and aging by customer' },
      { id: 'vehicle-pnl', name: 'Vehicle P&L', description: 'Profit and loss statement per vehicle' },
      { id: 'trip-profitability', name: 'Trip Profitability', description: 'Revenue, cost, and margin per trip' },
      { id: 'cost-per-km', name: 'Cost per KM', description: 'Cost/km benchmarking across the fleet' },
    ],
  },
  {
    id: 'management', name: 'Management',
    reports: [
      { id: 'operational-kpi', name: 'Operational KPI', description: 'Company-wide KPI scorecard' },
      { id: 'fleet-dashboard', name: 'Fleet Dashboard', description: 'Executive summary of fleet health and activity' },
      { id: 'profitability-report', name: 'Profitability Report', description: 'Consolidated profitability across all business lines' },
      { id: 'exceptions-report', name: 'Exceptions Report', description: 'All open exceptions and alerts requiring action' },
    ],
  },
];

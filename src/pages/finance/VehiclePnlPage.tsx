import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, Gauge, TrendingUp, Wallet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Select } from '@/components/ui/Field';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { vehicles } from '@/data/vehicles';
import { trips } from '@/data/trips';
import { maintenanceOrders, maintenanceCost } from '@/data/maintenance';
import { tyres } from '@/data/tyres';
import { formatCurrency } from '@/lib/utils';

interface VehiclePnl {
  vehicle: (typeof vehicles)[number];
  revenue: number;
  fuelCost: number;
  driverCost: number;
  maintenanceCost: number;
  tyreCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  margin: number;
  distance: number;
  tripCount: number;
}

function computePnl(): VehiclePnl[] {
  return vehicles.map((vehicle) => {
    const vTrips = trips.filter((t) => t.vehicleId === vehicle.id);
    const vMaint = maintenanceOrders.filter((m) => m.vehicleId === vehicle.id);
    const vTyres = tyres.filter((t) => t.vehicleId === vehicle.id);
    const revenue = vTrips.reduce((s, t) => s + t.revenue, 0);
    const fuelCost = vTrips.reduce((s, t) => s + t.fuelCost, 0);
    const driverCost = vTrips.reduce((s, t) => s + t.incentives + t.advance, 0);
    const otherCost = vTrips.reduce((s, t) => s + t.tolls + t.meals + t.loadingCharges + t.miscExpenses, 0);
    const maint = vMaint.reduce((s, m) => s + maintenanceCost(m), 0);
    const tyreCost = vTyres.reduce((s, t) => s + t.cost, 0);
    const totalCost = fuelCost + driverCost + otherCost + maint + tyreCost;
    const distance = vTrips.reduce((s, t) => s + t.distance, 0);
    return {
      vehicle, revenue, fuelCost, driverCost, maintenanceCost: maint, tyreCost, otherCost, totalCost,
      profit: revenue - totalCost, margin: revenue ? ((revenue - totalCost) / revenue) * 100 : 0,
      distance, tripCount: vTrips.length,
    };
  });
}

const COST_COLORS = ['#1d5b72', '#007080', '#f59e0b', '#94a3b8', '#7c3aed'];

export function VehiclePnlPage() {
  const navigate = useNavigate();
  const [filterId, setFilterId] = useState('');
  const allPnl = useMemo(() => computePnl(), []);
  const ranked = useMemo(() => [...allPnl].sort((a, b) => b.profit - a.profit), [allPnl]);

  const fleet = useMemo(() => {
    const revenue = allPnl.reduce((s, p) => s + p.revenue, 0);
    const cost = allPnl.reduce((s, p) => s + p.totalCost, 0);
    const distance = allPnl.reduce((s, p) => s + p.distance, 0);
    return {
      revenue, cost, profit: revenue - cost, margin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
      revenuePerKm: distance ? revenue / distance : 0, costPerKm: distance ? cost / distance : 0,
      fuelCost: allPnl.reduce((s, p) => s + p.fuelCost, 0),
      maintenanceCost: allPnl.reduce((s, p) => s + p.maintenanceCost, 0),
      driverCost: allPnl.reduce((s, p) => s + p.driverCost, 0),
      tyreCost: allPnl.reduce((s, p) => s + p.tyreCost, 0),
      otherCost: allPnl.reduce((s, p) => s + p.otherCost, 0),
    };
  }, [allPnl]);

  const costBreakdown = [
    { category: 'Fuel', value: fleet.fuelCost },
    { category: 'Driver', value: fleet.driverCost },
    { category: 'Maintenance', value: fleet.maintenanceCost },
    { category: 'Tyres', value: fleet.tyreCost },
    { category: 'Tolls & Misc', value: fleet.otherCost },
  ];

  const chartData = ranked.filter((p) => p.tripCount > 0).slice(0, 10).map((p) => ({ unit: p.vehicle.unitNumber, profit: p.profit }));

  const columns: Column<VehiclePnl>[] = [
    { key: 'unit', header: 'Vehicle', accessor: (p) => p.vehicle.unitNumber, sortable: true, render: (p) => <span className="font-semibold text-brand-800">{p.vehicle.unitNumber}</span> },
    { key: 'type', header: 'Type', render: (p) => <span className="text-slate-600">{p.vehicle.type}</span> },
    { key: 'trips', header: 'Trips', align: 'right', render: (p) => p.tripCount },
    { key: 'distance', header: 'Distance', align: 'right', render: (p) => `${p.distance.toLocaleString()} km` },
    { key: 'revenue', header: 'Revenue', align: 'right', accessor: (p) => p.revenue, sortable: true, render: (p) => formatCurrency(p.revenue) },
    { key: 'cost', header: 'Total Cost', align: 'right', accessor: (p) => p.totalCost, sortable: true, render: (p) => <span className="text-slate-500">{formatCurrency(p.totalCost)}</span> },
    { key: 'profit', header: 'Profit', align: 'right', accessor: (p) => p.profit, sortable: true, render: (p) => <span className={`font-semibold ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(p.profit)}</span> },
    { key: 'margin', header: 'Margin', align: 'right', accessor: (p) => p.margin, sortable: true, render: (p) => `${p.margin.toFixed(0)}%` },
    { key: 'costPerKm', header: 'Cost/KM', align: 'right', render: (p) => p.distance ? `${(p.totalCost / p.distance).toFixed(2)} AED` : '—' },
    { key: 'utilization', header: 'Utilization', align: 'right', render: (p) => `${p.vehicle.utilization}%` },
  ];

  const displayed = filterId ? allPnl.filter((p) => p.vehicle.id === filterId) : allPnl;

  return (
    <div>
      <PageHeader
        title="Vehicle P&L"
        description="Profitability analysis across the fleet — revenue, cost, and margin by vehicle."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Vehicle P&L' }]}
        actions={
          <Select value={filterId} onChange={(e) => setFilterId(e.target.value)} options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="All Fleet" className="w-44" />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Fleet Revenue" value={fleet.revenue} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
        <KpiCard index={1} label="Fleet Gross Profit" value={fleet.profit} format={(n) => formatCurrency(n, { compact: true })} icon={TrendingUp} accent="emerald" />
        <KpiCard index={2} label="Gross Margin" value={fleet.margin} format={(n) => `${n.toFixed(1)}%`} icon={BarChart3} accent="sky" />
        <KpiCard index={3} label="Revenue / Cost per KM" value={fleet.revenuePerKm} format={() => `${fleet.revenuePerKm.toFixed(2)} / ${fleet.costPerKm.toFixed(2)} AED`} icon={Gauge} accent="teal" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="Most Profitable Vehicles" subtitle="Top 10 by gross profit" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} width={60} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [formatCurrency(v), 'Profit']} />} />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]} fill="#1d5b72" barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet Cost Breakdown" subtitle="By category">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={costBreakdown} dataKey="value" nameKey="category" innerRadius={44} outerRadius={74} paddingAngle={2} strokeWidth={0}>
                {costBreakdown.map((c, i) => <Cell key={c.category} fill={COST_COLORS[i % COST_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v, n) => [formatCurrency(v), n]} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {costBreakdown.map((c, i) => (
              <div key={c.category} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }} />
                <span className="truncate">{c.category}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-semibold text-brand-950">Vehicle P&L Detail</h3>
            <p className="mt-0.5 text-xs text-slate-500">Full breakdown, sortable by any metric</p>
          </div>
          <Wallet size={16} className="text-slate-300" />
        </div>
        <DataTable columns={columns} data={displayed} keyField={(p) => p.vehicle.id} onRowClick={(p) => navigate(`/app/fleet/vehicles/${p.vehicle.id}`)} pageSize={12} />
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
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
import { opsApi, type VehiclePnlRow } from '@/lib/opsApi';
import { formatCurrency } from '@/lib/utils';

const COST_COLORS = ['#1d5b72', '#f59e0b', '#94a3b8'];

export function VehiclePnlPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VehiclePnlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterId, setFilterId] = useState('');

  useEffect(() => {
    opsApi.vehiclePnl.get().then((res) => setRows(res.items)).finally(() => setLoading(false));
  }, []);

  const ranked = useMemo(() => [...rows].sort((a, b) => b.profit - a.profit), [rows]);

  const fleet = useMemo(() => {
    const revenue = rows.reduce((s, p) => s + p.revenue, 0);
    const cost = rows.reduce((s, p) => s + p.totalCost, 0);
    return {
      revenue, cost, profit: revenue - cost, margin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
      fuelCost: rows.reduce((s, p) => s + p.fuelCost, 0),
      maintenanceCost: rows.reduce((s, p) => s + p.maintenanceCost, 0),
      expenseCost: rows.reduce((s, p) => s + p.expenseCost, 0),
    };
  }, [rows]);

  const costBreakdown = [
    { category: 'Fuel', value: fleet.fuelCost },
    { category: 'Maintenance', value: fleet.maintenanceCost },
    { category: 'Other Expenses', value: fleet.expenseCost },
  ];

  const chartData = ranked.filter((p) => p.trips > 0).slice(0, 10).map((p) => ({ unit: p.unitNumber, profit: p.profit }));

  const columns: Column<VehiclePnlRow>[] = [
    { key: 'unit', header: 'Vehicle', render: (p) => <span className="font-semibold text-brand-800">{p.unitNumber}</span> },
    { key: 'type', header: 'Type', render: (p) => <span className="text-slate-600">{p.type}</span> },
    { key: 'trips', header: 'Trips', align: 'right', render: (p) => p.trips },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (p) => formatCurrency(p.revenue) },
    { key: 'cost', header: 'Total Cost', align: 'right', render: (p) => <span className="text-slate-500">{formatCurrency(p.totalCost)}</span> },
    { key: 'profit', header: 'Profit', align: 'right', render: (p) => <span className={`font-semibold ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(p.profit)}</span> },
  ];

  const displayed = filterId ? rows.filter((p) => p.vehicleId === filterId) : rows;

  return (
    <div>
      <PageHeader
        title="Vehicle P&L"
        description="Profitability analysis across the fleet — revenue and cost computed from real trips, fuel, expenses and maintenance records."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Vehicle P&L' }]}
        actions={<Select value={filterId} onChange={(e) => setFilterId(e.target.value)} options={rows.map((v) => ({ label: v.unitNumber, value: v.vehicleId }))} placeholder="All Fleet" className="w-44" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Fleet Revenue" value={fleet.revenue} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
        <KpiCard index={1} label="Fleet Gross Profit" value={fleet.profit} format={(n) => formatCurrency(n, { compact: true })} icon={TrendingUp} accent="emerald" />
        <KpiCard index={2} label="Gross Margin" value={fleet.margin} format={(n) => `${n.toFixed(1)}%`} icon={BarChart3} accent="sky" />
        <KpiCard index={3} label="Total Cost" value={fleet.cost} format={(n) => formatCurrency(n, { compact: true })} icon={Gauge} accent="teal" />
      </div>

      {!loading && rows.length > 0 && (
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
      )}

      <Card className="mt-5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-semibold text-brand-950">Vehicle P&L Detail</h3>
            <p className="mt-0.5 text-xs text-slate-500">Full breakdown, sortable by any metric</p>
          </div>
          <Wallet size={16} className="text-slate-300" />
        </div>
        <DataTable columns={columns} data={displayed} keyField={(p) => p.vehicleId} onRowClick={(p) => navigate(`/app/fleet/vehicles/${p.vehicleId}`)} loading={loading} pageSize={displayed.length || 12} emptyTitle="No vehicles yet" />
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Award, DollarSign, Route as RouteIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { opsApi, type OpsReports } from '@/lib/opsApi';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#1d5b72', '#007080', '#f59e0b', '#94a3b8', '#7c3aed', '#0284c7'];

export function AnalyticsPage() {
  const [data, setData] = useState<OpsReports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opsApi.reports.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading analytics…</div>;
  if (!data) return <Card className="p-6"><EmptyState title="Could not load analytics" /></Card>;

  const financeBreakdown = [
    { category: 'Expenses', value: data.finance.expenses },
    { category: 'Fuel', value: data.finance.fuel },
    { category: 'Maintenance', value: data.finance.maintenance },
  ].filter((c) => c.value > 0);

  const utilization = data.fleet.totalVehicles ? Math.round(((data.fleet.byStatus['On Trip'] ?? 0) / data.fleet.totalVehicles) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Cross-cutting performance computed live from MongoDB — RRR, Jobs, Trips, Fleet and Finance."
        breadcrumbs={[{ label: 'Analytics' }, { label: 'Analytics' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Net Profit / Loss" value={data.finance.profitLoss} format={(n) => formatCurrency(n, { compact: true })} icon={TrendingUp} accent={data.finance.profitLoss >= 0 ? 'emerald' : 'brand'} />
        <KpiCard index={1} label="Revenue (Completed Jobs)" value={data.finance.revenue} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
        <KpiCard index={2} label="Completed Trips" value={data.trips.completed} format={(n) => `${n}`} icon={RouteIcon} accent="sky" />
        <KpiCard index={3} label="Fleet Utilization" value={utilization} format={(n) => `${n}%`} icon={Award} accent="teal" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Driver Activity" subtitle="Trips per driver (top 10)">
          {data.driverActivity.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No trips recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.driverActivity} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="driverName" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [String(v), 'Trips']} />} />
                <Bar dataKey="trips" fill="#1d5b72" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Cost Breakdown" subtitle="Expenses, fuel & maintenance">
          {financeBreakdown.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No costs recorded yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={financeBreakdown} dataKey="value" nameKey="category" innerRadius={44} outerRadius={74} paddingAngle={2} strokeWidth={0}>
                    {financeBreakdown.map((c, i) => <Cell key={c.category} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v, n) => [formatCurrency(v), n]} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5">
                {financeBreakdown.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{c.category}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatusBreakdownCard title="RRR by Status" data={data.rrr.byStatus} />
        <StatusBreakdownCard title="Jobs by Status" data={data.jobs.byStatus} />
        <StatusBreakdownCard title="Trips by Status" data={data.trips.byStatus} />
      </div>
    </div>
  );
}

function StatusBreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-display text-[14px] font-semibold text-brand-950">{title}</h3></div>
      <div className="flex flex-col gap-2.5 p-5">
        {entries.length === 0 && <p className="text-xs text-slate-400">No records yet.</p>}
        {entries.map(([status, count]) => (
          <div key={status}>
            <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-slate-600">{status}</span><span className="text-slate-500">{count}</span></div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

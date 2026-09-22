import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Route, Truck, Gauge, ClipboardList, Fuel, Wrench, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { StatusBadge } from '@/components/ui/Badge';
import { Timeline } from '@/components/ui/Timeline';
import { useAuth } from '@/lib/auth';
import { opsApi, type OpsReports, type AlertItem } from '@/lib/opsApi';
import { crmApi } from '@/pages/crm/crmApi';
import type { AuditLogEntry } from '@/pages/crm/types';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';

const COST_COLORS = ['#1d5b72', '#007080', '#f59e0b'];
const SEVERITY_TONE: Record<string, string> = { Critical: 'bg-rose-50 text-rose-600', High: 'bg-amber-50 text-amber-600', Medium: 'bg-sky-50 text-sky-600', Low: 'bg-slate-100 text-slate-500' };

export function Dashboard() {
  const { can } = useAuth();
  const [reports, setReports] = useState<OpsReports | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (can('analytics:view')) opsApi.reports.get().then(setReports).catch(() => {});
    if (can('alerts:view')) opsApi.alerts.list({ limit: 5 }).then((res) => setAlerts(res.items)).catch(() => {});
    crmApi.auditLog().then((res) => setActivity(res.items.slice(0, 8))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const utilization = reports?.fleet.totalVehicles ? Math.round(((reports.fleet.byStatus['On Trip'] ?? 0) / reports.fleet.totalVehicles) * 100) : 0;
  const pendingRrrs = (reports?.rrr.byStatus['Submitted'] ?? 0) + (reports?.rrr.byStatus['Draft'] ?? 0);

  const financeBreakdown = reports ? [
    { category: 'Fuel', value: reports.finance.fuel },
    { category: 'Maintenance', value: reports.finance.maintenance },
    { category: 'Other Expenses', value: reports.finance.expenses },
  ].filter((c) => c.value > 0) : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview of Momentum Logistics operations, computed from MongoDB."
      />

      {reports && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard index={0} label="Revenue (Completed Jobs)" value={reports.finance.revenue} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
          <KpiCard index={1} label="Active Trips" value={(reports.trips.byStatus['Dispatched'] ?? 0) + (reports.trips.byStatus['Started'] ?? 0) + (reports.trips.byStatus['In Transit'] ?? 0)} icon={Route} accent="sky" />
          <KpiCard index={2} label="Total Vehicles" value={reports.fleet.totalVehicles} icon={Truck} accent="teal" />
          <KpiCard index={3} label="Vehicle Utilization" value={utilization} format={(n) => `${n}%`} icon={Gauge} accent="brand" />
          <KpiCard index={4} label="Pending RRRs" value={pendingRrrs} icon={ClipboardList} accent="amber" />
          <KpiCard index={5} label="Completed Trips" value={reports.trips.completed} icon={Route} accent="emerald" />
          <KpiCard index={6} label="Fuel Cost" value={reports.finance.fuel} format={(n) => formatCurrency(n, { compact: true })} icon={Fuel} accent="rose" />
          <KpiCard index={7} label="Maintenance Cost" value={reports.finance.maintenance} format={(n) => formatCurrency(n, { compact: true })} icon={Wrench} accent="amber" />
        </div>
      )}

      {!reports && (
        <p className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-400">
          {can('analytics:view') ? 'Loading live figures…' : "You don't have permission to view analytics."}
        </p>
      )}

      {reports && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ChartCard title="Driver Activity" subtitle="Trips per driver (top 10)" className="lg:col-span-2">
            {reports.driverActivity.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No trips recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reports.driverActivity} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="driverName" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [String(v), 'Trips']} />} />
                  <Bar dataKey="trips" fill="#1d5b72" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Cost Breakdown" subtitle="Fuel, maintenance & other">
            {financeBreakdown.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No costs recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={financeBreakdown} dataKey="value" nameKey="category" innerRadius={40} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                    {financeBreakdown.map((c, i) => <Cell key={c.category} fill={COST_COLORS[i % COST_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v, n) => [formatCurrency(v), n]} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Exceptions" subtitle="Requires attention" action={<Link to="/app/alerts" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>}>
          <div className="flex flex-col gap-1">
            {alerts.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No open exceptions.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', SEVERITY_TONE[a.severity])}>
                  <AlertTriangle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{a.title}</p>
                    <StatusBadge status={a.severity} dot={false} />
                  </div>
                  {a.description && <p className="mt-0.5 truncate text-xs text-slate-500">{a.description}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Recent Activity" subtitle="Latest actions across the platform">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>
          ) : (
            <Timeline
              events={activity.map((a) => ({
                title: `${a.actorName} — ${a.action.replace(/_/g, ' ')}`,
                description: a.entity,
                timestamp: a.createdAt,
                icon: TrendingUp,
                tone: 'brand' as const,
              }))}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

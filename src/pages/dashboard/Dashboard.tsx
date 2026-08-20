import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Route, Truck, Gauge, ClipboardList, Timer, Fuel, Wrench,
  AlertTriangle, TrendingUp, ArrowRight, Circle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Timeline } from '@/components/ui/Timeline';
import { Link } from 'react-router-dom';
import { cn, formatCurrency, formatNumber, timeAgo } from '@/lib/utils';
import {
  kpis, revenueTrend, fleetUtilizationTrend, rrrPipeline, tripStatusBreakdown,
  fleetLiveSummary, profitability, costBreakdown,
} from '@/data/dashboard';
import { alerts } from '@/data/alerts';
import { activityFeed } from '@/data/activity';

const TREND_RANGES = ['4W', '8W', '12W'] as const;

const STATUS_COLORS: Record<string, string> = {
  Created: '#94a3b8', Dispatched: '#0284c7', 'In Transit': '#1d5b72', Delivered: '#008838', Closed: '#64748b', Delayed: '#e11d48',
};

const FLEET_COLORS: Record<string, string> = { success: '#008838', warning: '#f59e0b', neutral: '#94a3b8', orange: '#f97316' };

const COST_COLORS = ['#1d5b72', '#007080', '#f59e0b', '#0284c7', '#94a3b8', '#7c3aed'];

const SEVERITY_ICON_TONE: Record<string, 'danger' | 'warning' | 'brand' | 'neutral'> = {
  Critical: 'danger', High: 'warning', Medium: 'brand', Low: 'neutral',
};

export function Dashboard() {
  const [range, setRange] = useState<(typeof TREND_RANGES)[number]>('8W');
  const trendData = useMemo(() => {
    const n = range === '4W' ? 4 : range === '8W' ? 8 : 12;
    if (n <= revenueTrend.length) return revenueTrend.slice(-n);
    return revenueTrend;
  }, [range]);

  const topExceptions = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').slice(0, 5);
  const recentActivity = activityFeed.slice(0, 8);
  const maxPipeline = Math.max(...rrrPipeline.map((s) => s.count));
  const fleetTotal = fleetLiveSummary.reduce((s, f) => s + f.count, 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of Momentum Logistics operations across the network."
        actions={
          <>
            <Button variant="secondary" size="sm">Export Summary</Button>
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">Go to Reports</Button>
          </>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Total Revenue" value={kpis.totalRevenue.value} format={(n) => formatCurrency(n, { compact: true })} delta={kpis.totalRevenue.delta} trend={kpis.totalRevenue.trend} period={kpis.totalRevenue.period} icon={DollarSign} accent="brand" />
        <KpiCard index={1} label="Active Trips" value={kpis.activeTrips.value} delta={kpis.activeTrips.delta} trend={kpis.activeTrips.trend} period={kpis.activeTrips.period} icon={Route} accent="sky" />
        <KpiCard index={2} label="Active Vehicles" value={kpis.activeVehicles.value} delta={kpis.activeVehicles.delta} trend={kpis.activeVehicles.trend} period={kpis.activeVehicles.period} icon={Truck} accent="teal" />
        <KpiCard index={3} label="Vehicle Utilization" value={kpis.vehicleUtilization.value} format={(n) => `${n.toFixed(1)}%`} delta={kpis.vehicleUtilization.delta} trend={kpis.vehicleUtilization.trend} trendGood="up" period={kpis.vehicleUtilization.period} icon={Gauge} accent="brand" />
        <KpiCard index={4} label="Pending RRRs" value={kpis.pendingRrrs.value} delta={kpis.pendingRrrs.delta} trend={kpis.pendingRrrs.trend} trendGood="down" period={kpis.pendingRrrs.period} icon={ClipboardList} accent="amber" />
        <KpiCard index={5} label="On-Time Delivery" value={kpis.onTimeDelivery.value} format={(n) => `${n.toFixed(1)}%`} delta={kpis.onTimeDelivery.delta} trend={kpis.onTimeDelivery.trend} period={kpis.onTimeDelivery.period} icon={Timer} accent="emerald" />
        <KpiCard index={6} label="Fuel Cost" value={kpis.fuelCost.value} format={(n) => formatCurrency(n, { compact: true })} delta={kpis.fuelCost.delta} trend={kpis.fuelCost.trend} trendGood="down" period={kpis.fuelCost.period} icon={Fuel} accent="rose" />
        <KpiCard index={7} label="Maintenance Cost" value={kpis.maintenanceCost.value} format={(n) => formatCurrency(n, { compact: true })} delta={kpis.maintenanceCost.delta} trend={kpis.maintenanceCost.trend} trendGood="down" period={kpis.maintenanceCost.period} icon={Wrench} accent="amber" />
      </div>

      {/* Revenue & Trip Trends + Fleet Utilization */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard
          title="Revenue & Trip Trends"
          subtitle="Weekly revenue against operating cost and trip volume"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              {TREND_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors', range === r ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-500 hover:text-slate-700')}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d5b72" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1d5b72" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} width={64} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => [n === 'trips' ? formatNumber(v) : formatCurrency(v), n === 'trips' ? 'Trips' : n === 'revenue' ? 'Revenue' : 'Cost']} />} />
              <Area type="monotone" dataKey="cost" stroke="#94a3b8" strokeWidth={2} fill="url(#costGrad)" name="cost" />
              <Area type="monotone" dataKey="revenue" stroke="#1d5b72" strokeWidth={2.5} fill="url(#revGrad)" name="revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet Utilization" subtitle="6-month trend" delay={0.05}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fleetUtilizationTrend} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 90]} width={40} />
              <Tooltip content={<ChartTooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Utilization']} />} />
              <Line type="monotone" dataKey="utilization" stroke="#007080" strokeWidth={2.5} dot={{ r: 3, fill: '#007080' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pipeline / Trip status / Fleet summary */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="RRR Pipeline" subtitle="Requests by lifecycle stage" delay={0.1}>
          <div className="flex flex-col gap-3">
            {rrrPipeline.map((s, i) => (
              <div key={s.stage}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{s.stage}</span>
                  <span className="font-semibold text-brand-950">{s.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / maxPipeline) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Trip Status" subtitle="Live distribution across the fleet" delay={0.15}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tripStatusBreakdown} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 11.5, fill: '#475569' }} axisLine={false} tickLine={false} width={78} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [String(v), 'Trips']} />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {tripStatusBreakdown.map((s) => (
                  <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Live Fleet Summary" subtitle={`${fleetTotal} vehicles tracked`} delay={0.2}>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="42%" height={160}>
              <PieChart>
                <Pie data={fleetLiveSummary} dataKey="count" nameKey="status" innerRadius={42} outerRadius={64} paddingAngle={3} strokeWidth={0}>
                  {fleetLiveSummary.map((f) => (
                    <Cell key={f.status} fill={FLEET_COLORS[f.tone]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v, n) => [String(v), n]} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-1 flex-col gap-2.5">
              {fleetLiveSummary.map((f) => (
                <div key={f.status} className="flex items-center gap-2 text-[13px]">
                  <Circle size={9} fill={FLEET_COLORS[f.tone]} stroke="none" />
                  <span className="text-slate-600">{f.status}</span>
                  <span className="ml-auto font-semibold text-brand-950">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Profitability + cost breakdown */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="Profitability" subtitle="Revenue, cost, and margin trend" className="lg:col-span-2" delay={0.25}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={profitability} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} width={64} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} domain={[0, 40]} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => [n === 'margin' ? `${v.toFixed(1)}%` : formatCurrency(v), n === 'revenue' ? 'Revenue' : n === 'cost' ? 'Cost' : n === 'profit' ? 'Gross Profit' : 'Margin']} />} />
              <Bar yAxisId="left" dataKey="revenue" fill="#d2e1ea" radius={[4, 4, 0, 0]} barSize={22} name="revenue" />
              <Bar yAxisId="left" dataKey="cost" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={22} name="cost" />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#008838" strokeWidth={2.5} dot={{ r: 3.5, fill: '#008838' }} name="margin" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Breakdown" subtitle="This month, by category" delay={0.3}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={costBreakdown} dataKey="value" nameKey="category" innerRadius={48} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                {costBreakdown.map((c, i) => (
                  <Cell key={c.category} fill={COST_COLORS[i % COST_COLORS.length]} />
                ))}
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

      {/* Exceptions + Activity */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Exceptions"
          subtitle="Requires attention"
          delay={0.35}
          action={<Link to="/alerts" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>}
        >
          <div className="flex flex-col gap-1">
            {topExceptions.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  SEVERITY_ICON_TONE[a.severity] === 'danger' && 'bg-rose-50 text-rose-600',
                  SEVERITY_ICON_TONE[a.severity] === 'warning' && 'bg-amber-50 text-amber-600',
                )}>
                  <AlertTriangle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{a.title}</p>
                    <StatusBadge status={a.severity} dot={false} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{a.description}</p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(a.timestamp)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Recent Activity" subtitle="Latest actions across the platform" delay={0.4}>
          <Timeline
            events={recentActivity.map((a) => ({
              title: `${a.actor} ${a.action}`,
              description: `${a.entity} — ${a.module}`,
              timestamp: a.timestamp,
              icon: TrendingUp,
              tone: 'brand' as const,
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

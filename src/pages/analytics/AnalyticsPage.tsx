import { useMemo } from 'react';
import { Award, Fuel, Route as RouteIcon, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Card, CardHeader } from '@/components/ui/Card';
import { trips, tripProfit } from '@/data/trips';
import { getCustomer, customers } from '@/data/customers';
import { vehicles } from '@/data/vehicles';
import { drivers } from '@/data/drivers';
import { formatCurrency } from '@/lib/utils';

export function AnalyticsPage() {
  const customerRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trips) map.set(t.customerId, (map.get(t.customerId) ?? 0) + t.revenue);
    return Array.from(map.entries())
      .map(([id, revenue]) => ({ name: getCustomer(id)?.name.split(' ').slice(0, 2).join(' ') ?? id, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, []);

  const routeProfit = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trips) map.set(t.route, (map.get(t.route) ?? 0) + tripProfit(t));
    return Array.from(map.entries()).map(([route, profit]) => ({ route, profit })).sort((a, b) => b.profit - a.profit).slice(0, 8);
  }, []);

  const vehicleTypeProfit = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number }>();
    for (const t of trips) {
      const type = vehicles.find((v) => v.id === t.vehicleId)?.type ?? 'Other';
      const entry = map.get(type) ?? { revenue: 0, cost: 0 };
      entry.revenue += t.revenue;
      entry.cost += t.revenue - tripProfit(t);
      map.set(type, entry);
    }
    return Array.from(map.entries()).map(([type, v]) => ({ type, ...v }));
  }, []);

  const driverRadar = useMemo(() => (
    drivers.slice(0, 6).map((d) => ({ driver: d.name.split(' ')[0], rating: d.rating * 20, trips: Math.min(100, (d.totalTrips / 2200) * 100) }))
  ), []);

  const topCustomer = customerRevenue[0];
  const topRoute = routeProfit[0];
  const avgFuelEfficiency = useMemo(() => {
    const withFuel = trips.filter((t) => t.fuelLitres > 0);
    return withFuel.reduce((s, t) => s + t.distance / t.fuelLitres, 0) / withFuel.length;
  }, []);
  const avgMargin = useMemo(() => {
    const totalRevenue = trips.reduce((s, t) => s + t.revenue, 0);
    const totalProfit = trips.reduce((s, t) => s + tripProfit(t), 0);
    return (totalProfit / totalRevenue) * 100;
  }, []);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Cross-cutting performance analysis across customers, routes, fleet, and drivers."
        breadcrumbs={[{ label: 'Analytics' }, { label: 'Analytics' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Avg. Trip Margin" value={avgMargin} format={(n) => `${n.toFixed(1)}%`} icon={Award} accent="emerald" />
        <KpiCard index={1} label="Top Customer" value={topCustomer?.revenue ?? 0} format={(n) => formatCurrency(n, { compact: true })} icon={Users} accent="brand" />
        <KpiCard index={2} label="Most Profitable Route" value={topRoute?.profit ?? 0} format={(n) => formatCurrency(n, { compact: true })} icon={RouteIcon} accent="sky" />
        <KpiCard index={3} label="Fleet Fuel Efficiency" value={avgFuelEfficiency} format={(n) => `${n.toFixed(1)} km/L`} icon={Fuel} accent="teal" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Revenue by Customer" subtitle="Top 8 customers">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={customerRevenue} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />} />
              <Bar dataKey="revenue" fill="#1d5b72" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit by Route" subtitle="Top 8 routes" delay={0.05}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={routeProfit} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="route" tick={{ fontSize: 10.5, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v) => [formatCurrency(v), 'Profit']} />} />
              <Bar dataKey="profit" fill="#007080" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue vs Cost by Vehicle Type" delay={0.1}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleTypeProfit} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} width={66} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v, n) => [formatCurrency(v), n === 'revenue' ? 'Revenue' : 'Cost']} />} />
              <Bar dataKey="revenue" fill="#d2e1ea" radius={[4, 4, 0, 0]} barSize={18} name="revenue" />
              <Bar dataKey="cost" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={18} name="cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Driver Performance" subtitle="Rating & trip volume index" delay={0.15}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={driverRadar}>
              <PolarGrid stroke="#eef1f6" />
              <PolarAngleAxis dataKey="driver" tick={{ fontSize: 11, fill: '#475569' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#cbd5e1' }} axisLine={false} />
              <Radar name="Rating" dataKey="rating" stroke="#1d5b72" fill="#1d5b72" fillOpacity={0.25} />
              <Radar name="Trip Volume" dataKey="trips" stroke="#007080" fill="#007080" fillOpacity={0.18} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => [`${(v as number).toFixed(0)}`, n]} />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-5">
        <CardHeader title="Customer Profitability" subtitle="Ranked by contract value and outstanding balance" />
        <div className="divide-y divide-slate-100">
          {customers.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-brand-950">{c.name}</p>
                <p className="text-xs text-slate-400">{c.industry} · {c.city}</p>
              </div>
              <span className="text-xs text-slate-500">Credit Limit</span>
              <span className="w-24 text-right text-[13px] font-medium text-brand-950">{formatCurrency(c.creditLimit, { compact: true })}</span>
              <span className="text-xs text-slate-500">Outstanding</span>
              <span className="w-24 text-right text-[13px] font-semibold text-rose-600">{formatCurrency(c.outstandingBalance, { compact: true })}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

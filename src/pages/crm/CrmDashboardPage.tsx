import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Flame, CalendarClock, Trophy, TrendingUp, Target } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatPercent } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from './crmApi';
import { LeadTemperatureBadge } from './components/LeadBits';
import type { AnalyticsSummary, Lead } from './types';

export function CrmDashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const [summary, leads] = await Promise.all([
          crmApi.analytics(30, ctrl.signal),
          crmApi.listLeads({ limit: 8, sort: 'createdAt', dir: 'desc' }, ctrl.signal),
        ]);
        setData(summary);
        setRecent(leads.items);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const o = data?.overview;

  return (
    <div>
      <PageHeader
        title="CRM Overview"
        description="Lead generation and sales pipeline at a glance — last 30 days."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Overview' }]}
      />

      {error && <Card className="mb-5 p-4 text-sm text-rose-700">{error}</Card>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total leads" value={o?.totalLeads ?? 0} icon={Users} index={0} />
        <KpiCard label="New (30d)" value={o?.newLeads ?? 0} icon={Target} accent="teal" index={1} />
        <KpiCard label="Hot leads" value={o?.hotLeads ?? 0} icon={Flame} accent="rose" index={2} />
        <KpiCard label="Demo requests (30d)" value={o?.demoRequests ?? 0} icon={CalendarClock} accent="sky" index={3} />
        <KpiCard label="Qualified" value={o?.qualifiedLeads ?? 0} icon={TrendingUp} accent="brand" index={4} />
        <KpiCard label="Pending follow-ups" value={o?.pendingFollowups ?? 0} icon={CalendarClock} accent="amber" index={5} />
        <KpiCard label="Won" value={o?.wonDeals ?? 0} icon={Trophy} accent="emerald" index={6} />
        <KpiCard label="Conversion" value={o?.conversionRate ?? 0} format={(n) => formatPercent(n)} icon={TrendingUp} accent="emerald" index={7} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h3 className="font-display text-[15px] font-semibold text-brand-950">Pipeline</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <TableSkeleton columns={2} />
            ) : (
              <div className="space-y-2.5">
                {(data?.pipeline ?? []).map((stage) => {
                  const max = Math.max(1, ...(data?.pipeline ?? []).map((s) => s.count));
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-[12.5px] text-slate-600">{stage.stage}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                        <div
                          className="flex h-full items-center justify-end rounded-md bg-brand-500/85 px-2 text-[11px] font-semibold text-white"
                          style={{ width: `${Math.max(6, (stage.count / max) * 100)}%` }}
                        >
                          {stage.count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h3 className="font-display text-[15px] font-semibold text-brand-950">Leads by source</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <TableSkeleton columns={2} />
            ) : (data?.bySource ?? []).length === 0 ? (
              <p className="text-[13px] text-slate-400">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {(data?.bySource ?? []).slice(0, 8).map((s) => (
                  <li key={s.source} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">{s.source}</span>
                    <span className="font-semibold text-brand-950">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="font-display text-[15px] font-semibold text-brand-950">Recent leads</h3>
          <Link to="/app/crm/leads" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-5"><TableSkeleton columns={5} /></div>
        ) : recent.length === 0 ? (
          <EmptyState title="No leads yet" description="Leads from your website forms and chatbot will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 text-left">Lead</th>
                  <th className="px-3 py-2.5 text-left">Product</th>
                  <th className="px-3 py-2.5 text-left">Score</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Source</th>
                  <th className="px-5 py-2.5 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/40">
                    <td className="px-5 py-3">
                      <Link to={`/app/crm/leads/${lead.id}`} className="font-medium text-brand-900 hover:underline">{lead.name}</Link>
                      <p className="text-xs text-slate-400">{lead.company ?? lead.email ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{lead.productInterest}</td>
                    <td className="px-3 py-3"><LeadTemperatureBadge temperature={lead.temperature} score={lead.score} /></td>
                    <td className="px-3 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-3 py-3 text-slate-600">{lead.attribution.source}</td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

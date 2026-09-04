import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { crmApi } from './crmApi';
import { ScoreBar } from './components/LeadBits';
import { NewLeadModal } from './components/NewLeadModal';
import { LEAD_STATUSES, LEAD_TEMPERATURES, type Lead } from './types';

const PRODUCTS = ['ERP Suite', 'FBR Invoicing', 'Cloud & AI', 'Custom Software', 'Unspecified'];

export function LeadsPage() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ items: Lead[]; total: number; totalPages: number; page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');

  const query = useMemo(
    () => ({
      page: Number(params.get('page') ?? 1),
      q: params.get('q') ?? undefined,
      status: params.get('status') ?? undefined,
      temperature: params.get('temperature') ?? undefined,
      product: params.get('product') ?? undefined,
      assignedTo: params.get('assignedTo') ?? undefined,
      sort: 'createdAt',
      dir: 'desc' as const,
    }),
    [params],
  );

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      crmApi
        .listLeads(query, signal)
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          setError(err.message);
        })
        .finally(() => setLoading(false));
    },
    [query],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== search) setParam('q', search);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every enquiry from your website, chatbot and campaigns — searchable and filterable."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={
          can('leads:create') ? (
            <Button size="sm" icon={Plus} onClick={() => setShowNew(true)}>New lead</Button>
          ) : undefined
        }
      />

      <Toolbar className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, company, email…" className="sm:max-w-xs" />
        <Select
          className="sm:max-w-[150px]"
          value={params.get('status') ?? ''}
          onChange={(e) => setParam('status', e.target.value)}
          placeholder="All statuses"
          options={LEAD_STATUSES.map((s) => ({ label: s, value: s }))}
        />
        <Select
          className="sm:max-w-[140px]"
          value={params.get('temperature') ?? ''}
          onChange={(e) => setParam('temperature', e.target.value)}
          placeholder="Any temperature"
          options={LEAD_TEMPERATURES.map((s) => ({ label: s, value: s }))}
        />
        <Select
          className="sm:max-w-[160px]"
          value={params.get('product') ?? ''}
          onChange={(e) => setParam('product', e.target.value)}
          placeholder="Any product"
          options={PRODUCTS.map((s) => ({ label: s, value: s }))}
        />
        <Select
          className="sm:max-w-[150px]"
          value={params.get('assignedTo') ?? ''}
          onChange={(e) => setParam('assignedTo', e.target.value)}
          placeholder="Anyone"
          options={[
            { label: 'Assigned to me', value: 'me' },
            { label: 'Unassigned', value: 'unassigned' },
          ]}
        />
      </Toolbar>

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <Card>
        {loading && !data ? (
          <div className="p-5"><TableSkeleton columns={6} /></div>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            variant="search"
            title="No leads match your filters"
            description="Try clearing a filter or broadening your search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 text-left">Lead</th>
                  <th className="px-3 py-2.5 text-left">Product</th>
                  <th className="px-3 py-2.5 text-left">Score</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Owner</th>
                  <th className="px-3 py-2.5 text-left">Source</th>
                  <th className="px-5 py-2.5 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/40">
                    <td className="px-5 py-3">
                      <Link to={`/app/crm/leads/${lead.id}`} className="font-medium text-brand-900 hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {lead.company ?? '—'}
                        {lead.email ? ` · ${lead.email}` : ''}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{lead.productInterest}</td>
                    <td className="px-3 py-3"><ScoreBar score={lead.score} /></td>
                    <td className="px-3 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-3 py-3 text-slate-600">{lead.assignedToName ?? <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="px-3 py-3 text-slate-600">{lead.attribution.source}</td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3">
            <span className="text-xs text-slate-500">{data.total} leads</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setParam('page', String(Math.max(1, query.page - 1)))}
                disabled={query.page <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs font-medium text-slate-600">{query.page} / {data.totalPages}</span>
              <button
                onClick={() => setParam('page', String(Math.min(data.totalPages, query.page + 1)))}
                disabled={query.page >= data.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <NewLeadModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => load()} />
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { rrrApi, RRR_PRIORITIES, RRR_STATUSES, type Rrr, type RrrCustomer } from './rrrApi';

export function RrrList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [items, setItems] = useState<Rrr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [customers, setCustomers] = useState<RrrCustomer[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, completed: 0 });

  useEffect(() => {
    const ctrl = new AbortController();
    rrrApi.customers(ctrl.signal).then((res) => setCustomers(res.items)).catch(() => {});
    return () => ctrl.abort();
  }, []);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      rrrApi
        .list({ page, limit: 8, q: search || undefined, status: status || undefined, priority: priority || undefined }, signal)
        .then((res) => {
          setItems(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setError(null);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(err.message ?? 'Failed to load RRRs');
        })
        .finally(() => setLoading(false));
    },
    [page, search, status, priority],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Lightweight aggregate counts for the stat cards — independent of the current filters/page.
  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      rrrApi.list({ limit: 1 }, ctrl.signal),
      rrrApi.list({ limit: 1, status: 'Draft,Submitted' }, ctrl.signal),
      rrrApi.list({ limit: 1, status: 'Approved,Assigned,Job Created,Dispatched' }, ctrl.signal),
      rrrApi.list({ limit: 1, status: 'Completed' }, ctrl.signal),
    ])
      .then(([all, pending, active, completed]) => {
        setStats({ total: all.total, pending: pending.total, active: active.total, completed: completed.total });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [items]);

  useEffect(() => setPage(1), [search, status, priority]);

  const columns: Column<Rrr>[] = [
    { key: 'ref', header: 'RRR #', render: (r) => <span className="font-semibold text-brand-800">{r.ref}</span> },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt, 'short') },
    { key: 'customer', header: 'Customer', render: (r) => <p className="font-medium text-brand-950">{r.customerName}</p> },
    { key: 'route', header: 'Pickup → Destination', render: (r) => (
      <div className="max-w-[220px]">
        <p className="truncate text-[13px] text-slate-700">{r.pickup}</p>
        <p className="truncate text-xs text-slate-400">→ {r.destination}</p>
      </div>
    ) },
    { key: 'vehicleType', header: 'Vehicle Type', render: (r) => <span className="text-slate-600">{r.vehicleType}</span> },
    { key: 'requiredDate', header: 'Required', render: (r) => formatDate(r.requiredDate, 'short') },
    { key: 'priority', header: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="RRR — Requisition Requests"
        description="Manage transport requisitions from customer request through approval and assignment."
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR' }]}
        actions={can('rrr:create') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/app/rrr/new')}>New RRR</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total RRRs', value: stats.total, tone: 'text-brand-800' },
          { label: 'Pending Action', value: stats.pending, tone: 'text-amber-600' },
          { label: 'In Progress', value: stats.active, tone: 'text-sky-600' },
          { label: 'Completed', value: stats.completed, tone: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <Card className="px-4 py-3.5">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search RRR #, customer, route..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={RRR_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={RRR_PRIORITIES.map((s) => ({ label: s, value: s }))} placeholder="All Priorities" className="sm:w-40" />
        {(search || status || priority) && (
          <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">
            Clear filters
          </button>
        )}
      </Toolbar>

      <Card>
        <DataTable
          columns={columns}
          data={items}
          keyField={(r) => r.id}
          onRowClick={(r) => navigate(`/app/rrr/${r.id}`)}
          loading={loading}
          pageSize={items.length || 8}
          emptyTitle={customers.length === 0 ? 'No customers yet' : 'No RRRs match your filters'}
          emptyDescription={customers.length === 0 ? 'Add a customer from "New RRR" before raising your first request.' : 'Try adjusting your search or clearing filters to see more requests.'}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3">
            <span className="text-xs text-slate-500">{total} requests</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs font-medium text-slate-600">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

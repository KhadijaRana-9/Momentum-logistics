import { useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from '@/pages/crm/crmApi';
import type { AuditLogEntry } from '@/pages/crm/types';

function describeChanges(entry: AuditLogEntry): { previous: string; next: string } {
  if (!entry.changes.length) return { previous: '—', next: '—' };
  const first = entry.changes[0];
  const extra = entry.changes.length > 1 ? ` (+${entry.changes.length - 1} more)` : '';
  return {
    previous: `${first.field}: ${JSON.stringify(first.from)}`,
    next: `${first.field}: ${JSON.stringify(first.to)}${extra}`,
  };
}

export function AuditTrailPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    crmApi
      .auditLog(ctrl.signal)
      .then((res) => setItems(res.items))
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load audit trail');
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(
    () => items.filter((a) => `${a.actorName} ${a.action} ${a.entity}`.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const columns: Column<AuditLogEntry>[] = [
    { key: 'createdAt', header: 'Date/Time', accessor: (a) => a.createdAt, sortable: true, render: (a) => <span className="text-slate-500">{formatDateTime(a.createdAt)}</span> },
    { key: 'actorName', header: 'User', render: (a) => <span className="font-medium text-brand-950">{a.actorName}</span> },
    { key: 'action', header: 'Action', render: (a) => <span className="text-slate-700">{a.action}</span> },
    { key: 'entity', header: 'Entity', render: (a) => <span className="font-medium text-brand-800">{a.entity}{a.entityId ? ` (${a.entityId})` : ''}</span> },
    { key: 'previous', header: 'Previous Value', render: (a) => <span className="text-slate-500 line-through decoration-slate-300">{describeChanges(a).previous}</span> },
    { key: 'new', header: 'New Value', render: (a) => <span className="font-medium text-emerald-700">{describeChanges(a).next}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Full history of changes across the platform for compliance and traceability."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Audit Trail' }]}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user, action, entity..." className="sm:max-w-xs" />
        <span className="flex items-center gap-1.5 text-xs text-slate-400 sm:ml-auto"><History size={13} /> {items.length} entries logged</span>
      </Toolbar>

      <Card>
        {loading ? <div className="p-5"><TableSkeleton columns={6} /></div> : <DataTable columns={columns} data={filtered} keyField={(a) => a.id} pageSize={10} />}
      </Card>
    </div>
  );
}

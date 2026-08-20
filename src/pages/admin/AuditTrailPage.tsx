import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { auditTrail } from '@/data/users';
import type { AuditEntry } from '@/data/types';
import { formatDateTime } from '@/lib/utils';

export function AuditTrailPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => auditTrail.filter((a) => `${a.user} ${a.action} ${a.entity}`.toLowerCase().includes(search.toLowerCase())), [search]);

  const columns: Column<AuditEntry>[] = [
    { key: 'timestamp', header: 'Date/Time', accessor: (a) => a.timestamp, sortable: true, render: (a) => <span className="text-slate-500">{formatDateTime(a.timestamp)}</span> },
    { key: 'user', header: 'User', render: (a) => <span className="font-medium text-brand-950">{a.user}</span> },
    { key: 'action', header: 'Action', render: (a) => <span className="text-slate-700">{a.action}</span> },
    { key: 'entity', header: 'Entity', render: (a) => <span className="font-medium text-brand-800">{a.entity}</span> },
    { key: 'previous', header: 'Previous Value', render: (a) => <span className="text-slate-500 line-through decoration-slate-300">{a.previousValue}</span> },
    { key: 'new', header: 'New Value', render: (a) => <span className="font-medium text-emerald-700">{a.newValue}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Full history of changes across the platform for compliance and traceability."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Audit Trail' }]}
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user, action, entity..." className="sm:max-w-xs" />
        <span className="flex items-center gap-1.5 text-xs text-slate-400 sm:ml-auto"><History size={13} /> {auditTrail.length} entries logged</span>
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(a) => a.id} pageSize={10} />
      </Card>
    </div>
  );
}

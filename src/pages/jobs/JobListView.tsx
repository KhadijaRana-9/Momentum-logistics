import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import type { Job } from '@/lib/opsApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function JobListView({ jobs, loading }: { jobs: Job[]; loading?: boolean }) {
  const navigate = useNavigate();

  const columns: Column<Job>[] = [
    { key: 'ref', header: 'Job #', render: (j) => <span className="font-semibold text-brand-800">{j.ref}</span> },
    { key: 'rrrRef', header: 'RRR #', render: (j) => <span className="text-slate-500">{j.rrrRef}</span> },
    { key: 'customer', header: 'Customer', render: (j) => <span className="font-medium text-brand-950">{j.customerName}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (j) => j.vehicleRef ? <span className="text-slate-600">{j.vehicleRef}</span> : <span className="text-xs text-slate-400">Unassigned</span> },
    { key: 'driver', header: 'Driver', render: (j) => j.driverName ? <span className="text-slate-600">{j.driverName}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: 'route', header: 'Route', render: (j) => <span className="text-slate-600">{j.pickup} → {j.destination}</span> },
    { key: 'scheduledDate', header: 'Schedule', render: (j) => formatDate(j.scheduledDate, 'short') },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'trip', header: 'Trip', render: (j) => j.tripRef ? <span className="font-medium text-brand-700">{j.tripRef}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: 'billing', header: 'Billing', render: (j) => <StatusBadge status={j.billingStatus} dot={false} /> },
    { key: 'revenue', header: 'Value', align: 'right', render: (j) => <span className="font-medium text-brand-950">{formatCurrency(j.revenue)}</span> },
  ];

  return (
    <Card>
      <DataTable
        columns={columns}
        data={jobs}
        keyField={(j) => j.id}
        onRowClick={(j) => (j.tripId ? navigate(`/app/trips/${j.tripId}`) : navigate('/app/dispatch'))}
        loading={loading}
        pageSize={jobs.length || 10}
        emptyTitle="No jobs yet"
        emptyDescription="Jobs are created from an Approved RRR — open a request in RRR and use “Create Job”."
      />
    </Card>
  );
}

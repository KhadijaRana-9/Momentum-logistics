import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import type { Job } from '@/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function JobListView({ jobs }: { jobs: Job[] }) {
  const navigate = useNavigate();

  const columns: Column<Job>[] = [
    { key: 'id', header: 'Job #', accessor: (j) => j.id, sortable: true, render: (j) => <span className="font-semibold text-brand-800">{j.id}</span> },
    { key: 'rrrId', header: 'RRR #', render: (j) => <span className="text-slate-500">{j.rrrId}</span> },
    { key: 'customer', header: 'Customer', render: (j) => <span className="font-medium text-brand-950">{getCustomer(j.customerId)?.name}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (j) => {
      const v = getVehicle(j.vehicleId);
      return v ? <span className="text-slate-600">{v.unitNumber}</span> : <span className="text-xs text-slate-400">Unassigned</span>;
    } },
    { key: 'driver', header: 'Driver', render: (j) => {
      const d = getDriver(j.driverId);
      return d ? <span className="text-slate-600">{d.name}</span> : <span className="text-xs text-slate-400">—</span>;
    } },
    { key: 'route', header: 'Route', render: (j) => <span className="text-slate-600">{j.route}</span> },
    { key: 'scheduledDate', header: 'Schedule', accessor: (j) => j.scheduledDate, sortable: true, render: (j) => formatDate(j.scheduledDate, 'short') },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'trip', header: 'Trip', render: (j) => j.tripId ? <span className="font-medium text-brand-700">{j.tripId}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: 'billing', header: 'Billing', render: (j) => <StatusBadge status={j.billingStatus} dot={false} /> },
    { key: 'revenue', header: 'Value', align: 'right', accessor: (j) => j.revenue, sortable: true, render: (j) => <span className="font-medium text-brand-950">{formatCurrency(j.revenue)}</span> },
  ];

  return (
    <Card>
      <DataTable
        columns={columns}
        data={jobs}
        keyField={(j) => j.id}
        onRowClick={(j) => j.tripId ? navigate(`/app/trips/${j.tripId}`) : navigate(`/app/jobs`)}
        pageSize={10}
      />
    </Card>
  );
}

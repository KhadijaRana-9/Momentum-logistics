import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { trips, tripCost, tripProfit } from '@/data/trips';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import type { Trip } from '@/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSimulatedLoading } from '@/lib/useSimulatedLoading';

const STATUS_OPTIONS = ['Created', 'Dispatched', 'Started', 'In Transit', 'Arrived', 'Delivered', 'Closed', 'Verified', 'Financially Closed', 'Delayed'];

export function TripList() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => trips.filter((t) => {
    if (status && t.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${t.id} ${t.jobId} ${getCustomer(t.customerId)?.name} ${t.route}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const summary = useMemo(() => ({
    active: trips.filter((t) => ['Dispatched', 'Started', 'In Transit'].includes(t.status)).length,
    revenue: trips.reduce((s, t) => s + t.revenue, 0),
    profit: trips.reduce((s, t) => s + tripProfit(t), 0),
  }), []);

  const columns: Column<Trip>[] = [
    { key: 'id', header: 'Trip #', accessor: (t) => t.id, sortable: true, render: (t) => <span className="font-semibold text-brand-800">{t.id}</span> },
    { key: 'jobId', header: 'Job #', render: (t) => <span className="text-slate-500">{t.jobId}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (t) => <span className="text-slate-600">{getVehicle(t.vehicleId)?.unitNumber}</span> },
    { key: 'driver', header: 'Driver', render: (t) => <span className="text-slate-600">{getDriver(t.driverId)?.name}</span> },
    { key: 'customer', header: 'Customer', render: (t) => <span className="font-medium text-brand-950">{getCustomer(t.customerId)?.name}</span> },
    { key: 'route', header: 'Route', render: (t) => <span className="text-slate-600">{t.route}</span> },
    { key: 'start', header: 'Start', accessor: (t) => t.startTime, sortable: true, render: (t) => formatDate(t.startTime, 'short') },
    { key: 'distance', header: 'Distance', align: 'right', accessor: (t) => t.distance, render: (t) => `${t.distance} km` },
    { key: 'revenue', header: 'Revenue', align: 'right', accessor: (t) => t.revenue, sortable: true, render: (t) => formatCurrency(t.revenue) },
    { key: 'cost', header: 'Cost', align: 'right', render: (t) => <span className="text-slate-500">{formatCurrency(tripCost(t))}</span> },
    { key: 'profit', header: 'Profit', align: 'right', render: (t) => {
      const p = tripProfit(t);
      return <span className={p >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{formatCurrency(p)}</span>;
    } },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Digital trip sheets covering the full journey from dispatch to financial close."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Trips' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/app/dispatch')}>New Trip</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active Trips</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Revenue</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.revenue, { compact: true })}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Net Profit</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(summary.profit, { compact: true })}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search trip #, job #, customer, route..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(t) => t.id} onRowClick={(t) => navigate(`/app/trips/${t.id}`)} loading={loading} pageSize={8} />
      </Card>
    </div>
  );
}

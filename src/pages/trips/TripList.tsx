import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { opsApi, TRIP_STATUSES, type Trip } from '@/lib/opsApi';
import { formatDate } from '@/lib/utils';

export function TripList() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    opsApi.trips
      .list({ limit: 200, status: status || undefined }, ctrl.signal)
      .then((res) => { setTrips(res.items); setError(null); })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load trips'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [status]);

  const filtered = useMemo(() => trips.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${t.ref} ${t.jobRef} ${t.customerName} ${t.route}`.toLowerCase().includes(q);
  }), [trips, search]);

  const summary = useMemo(() => ({
    active: trips.filter((t) => ['Dispatched', 'Started', 'In Transit'].includes(t.status)).length,
    completed: trips.filter((t) => t.status === 'Completed').length,
  }), [trips]);

  const columns: Column<Trip>[] = [
    { key: 'ref', header: 'Trip #', render: (t) => <span className="font-semibold text-brand-800">{t.ref}</span> },
    { key: 'jobRef', header: 'Job #', render: (t) => <span className="text-slate-500">{t.jobRef}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (t) => <span className="text-slate-600">{t.vehicleRef}</span> },
    { key: 'driver', header: 'Driver', render: (t) => <span className="text-slate-600">{t.driverName}</span> },
    { key: 'customer', header: 'Customer', render: (t) => <span className="font-medium text-brand-950">{t.customerName}</span> },
    { key: 'route', header: 'Route', render: (t) => <span className="text-slate-600">{t.route}</span> },
    { key: 'start', header: 'Start', render: (t) => formatDate(t.startTime, 'short') },
    { key: 'distance', header: 'Distance', align: 'right', render: (t) => t.distanceKm != null ? `${t.distanceKm} km` : '—' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Digital trip sheets covering the full journey from dispatch to delivery."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Trips' }]}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active Trips</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Completed</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.completed}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search trip #, job #, customer, route..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={TRIP_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(t) => t.id} onRowClick={(t) => navigate(`/app/trips/${t.id}`)} loading={loading} pageSize={filtered.length || 8} />
      </Card>
    </div>
  );
}

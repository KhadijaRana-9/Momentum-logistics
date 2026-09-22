import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useAuth } from '@/lib/auth';
import { opsApi, VEHICLE_STATUSES, type Vehicle } from '@/lib/opsApi';
import { NewVehicleModal } from './components/NewVehicleModal';

export function VehicleList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);

  function load(signal?: AbortSignal) {
    setLoading(true);
    opsApi.vehicles.list({ limit: 200, status: status || undefined, q: search || undefined }, signal)
      .then((res) => setVehicles(res.items))
      .catch((err) => { if (err.name !== 'AbortError') void err; })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const summary = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'Available').length,
    onTrip: vehicles.filter((v) => v.status === 'On Trip').length,
    maintenance: vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'Out of Service').length,
  }), [vehicles]);

  const columns: Column<Vehicle>[] = [
    { key: 'unit', header: 'Unit', render: (v) => (
      <div>
        <p className="font-semibold text-brand-800">{v.unitNumber}</p>
        <p className="text-xs text-slate-400">{v.registration}</p>
      </div>
    ) },
    { key: 'type', header: 'Type', render: (v) => <span className="text-slate-600">{v.type}</span> },
    { key: 'model', header: 'Make / Model', render: (v) => <span className="text-slate-600">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</span> },
    { key: 'driver', header: 'Driver', render: (v) => v.driverName ? <span className="text-slate-600">{v.driverName}</span> : <span className="text-xs text-slate-400">Unassigned</span> },
    { key: 'branch', header: 'Home Branch', render: (v) => <span className="text-slate-500">{v.homeBranch ?? '—'}</span> },
    { key: 'odometer', header: 'Odometer', align: 'right', render: (v) => `${v.odometer.toLocaleString()} km` },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Fleet roster with live status and maintenance state."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles' }]}
        actions={can('fleet:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>Add Vehicle</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Fleet</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Available</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.available}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">On Trip</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.onTrip}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Maintenance</p><p className="mt-1 font-display text-2xl font-bold text-orange-600">{summary.maintenance}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search unit, registration, model..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={VEHICLE_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable
          columns={columns} data={vehicles} keyField={(v) => v.id}
          onRowClick={(v) => navigate(`/app/fleet/vehicles/${v.id}`)} loading={loading} pageSize={vehicles.length || 8}
          emptyTitle="No vehicles yet" emptyDescription="Add your first vehicle to start assigning jobs."
        />
      </Card>

      <NewVehicleModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => load()} />
    </div>
  );
}

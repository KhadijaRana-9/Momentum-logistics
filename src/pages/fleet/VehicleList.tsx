import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Satellite, WifiOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { vehicles } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import type { Vehicle } from '@/data/types';
import { cn } from '@/lib/utils';
import { useSimulatedLoading } from '@/lib/useSimulatedLoading';

const STATUS_OPTIONS = ['Moving', 'Idle', 'Offline', 'Maintenance', 'Out of Service'];
const TYPE_OPTIONS = Array.from(new Set(vehicles.map((v) => v.type)));

export function VehicleList() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const filtered = useMemo(() => vehicles.filter((v) => {
    if (status && v.status !== status) return false;
    if (type && v.type !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${v.unitNumber} ${v.registration} ${v.make} ${v.model}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [search, status, type]);

  const summary = useMemo(() => ({
    total: vehicles.length,
    moving: vehicles.filter((v) => v.status === 'Moving').length,
    maintenance: vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'Out of Service').length,
    avgUtil: Math.round(vehicles.reduce((s, v) => s + v.utilization, 0) / vehicles.length),
  }), []);

  const columns: Column<Vehicle>[] = [
    { key: 'unit', header: 'Unit', accessor: (v) => v.unitNumber, sortable: true, render: (v) => (
      <div>
        <p className="font-semibold text-brand-800">{v.unitNumber}</p>
        <p className="text-xs text-slate-400">{v.registration}</p>
      </div>
    ) },
    { key: 'type', header: 'Type', render: (v) => <span className="text-slate-600">{v.type}</span> },
    { key: 'model', header: 'Make / Model', render: (v) => <span className="text-slate-600">{v.make} {v.model}</span> },
    { key: 'driver', header: 'Driver', render: (v) => {
      const d = getDriver(v.driverId);
      return d ? <span className="text-slate-600">{d.name}</span> : <span className="text-xs text-slate-400">Unassigned</span>;
    } },
    { key: 'location', header: 'Location', render: (v) => <span className="max-w-[160px] truncate text-slate-500">{v.location}</span> },
    { key: 'odometer', header: 'Odometer', align: 'right', accessor: (v) => v.odometer, sortable: true, render: (v) => `${v.odometer.toLocaleString()} km` },
    { key: 'fuel', header: 'Fuel', align: 'right', render: (v) => (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
          <span className={cn('block h-full rounded-full', v.fuelLevel > 30 ? 'bg-emerald-500' : 'bg-rose-500')} style={{ width: `${v.fuelLevel}%` }} />
        </span>
        <span className="text-xs text-slate-500">{v.fuelLevel}%</span>
      </span>
    ) },
    { key: 'tracker', header: 'Tracker', align: 'center', render: (v) => (
      v.trackerStatus === 'Online'
        ? <Satellite size={14} className="mx-auto text-emerald-500" />
        : v.trackerStatus === 'Weak Signal'
          ? <Satellite size={14} className="mx-auto text-amber-500" />
          : <WifiOff size={14} className="mx-auto text-rose-500" />
    ) },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Fleet roster with live status, fuel, tracker health, and maintenance state."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>Add Vehicle</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Fleet</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Currently Moving</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.moving}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Maintenance</p><p className="mt-1 font-display text-2xl font-bold text-orange-600">{summary.maintenance}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Utilization</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.avgUtil}%</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search unit, registration, model..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Types" className="sm:w-52" />
        {(search || status || type) && (
          <button onClick={() => { setSearch(''); setStatus(''); setType(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(v) => v.id} onRowClick={(v) => navigate(`/app/fleet/vehicles/${v.id}`)} loading={loading} pageSize={8} />
      </Card>
    </div>
  );
}

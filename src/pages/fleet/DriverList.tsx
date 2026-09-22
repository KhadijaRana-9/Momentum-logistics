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
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useAuth } from '@/lib/auth';
import { opsApi, DRIVER_STATUSES, type Driver } from '@/lib/opsApi';
import { cn, formatDate } from '@/lib/utils';
import { NewDriverModal } from './components/NewDriverModal';

const AVATAR_COLORS = ['#365D90', '#0D9488', '#B45309', '#7C3AED', '#0284C7', '#BE123C'];

export function DriverList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);

  function load(signal?: AbortSignal) {
    setLoading(true);
    opsApi.drivers.list({ limit: 200, status: status || undefined, q: search || undefined }, signal)
      .then((res) => setDrivers(res.items))
      .catch((err) => { if (err.name !== 'AbortError') void err; })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const summary = useMemo(() => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 2);
    return {
      total: drivers.length,
      onTrip: drivers.filter((d) => d.status === 'On Trip').length,
      active: drivers.filter((d) => d.status === 'Active').length,
      expiringLicense: drivers.filter((d) => d.licenseExpiry && new Date(d.licenseExpiry) < soon).length,
    };
  }, [drivers]);

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Driver', render: (d) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={d.name} color={AVATAR_COLORS[d.id.charCodeAt(4) % AVATAR_COLORS.length]} size="sm" />
        <div>
          <p className="font-medium text-brand-950">{d.name}</p>
          <p className="text-xs text-slate-400">{d.nationality ?? '—'}</p>
        </div>
      </div>
    ) },
    { key: 'phone', header: 'Contact', render: (d) => <span className="text-slate-600">{d.phone ?? '—'}</span> },
    { key: 'license', header: 'License #', render: (d) => <span className="text-slate-600">{d.licenseNumber}</span> },
    { key: 'expiry', header: 'License Expiry', render: (d) => {
      const soon = new Date(); soon.setMonth(soon.getMonth() + 2);
      const isSoon = d.licenseExpiry ? new Date(d.licenseExpiry) < soon : false;
      return <span className={cn(isSoon ? 'font-medium text-amber-600' : 'text-slate-600')}>{d.licenseExpiry ? formatDate(d.licenseExpiry, 'short') : '—'}</span>;
    } },
    { key: 'vehicle', header: 'Assigned Vehicle', render: (d) => d.assignedVehicleRef ? <span className="text-slate-600">{d.assignedVehicleRef}</span> : <span className="text-xs text-slate-400">Unassigned</span> },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Driver roster with licensing and assignment status."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers' }]}
        actions={can('fleet:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>Add Driver</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Drivers</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Currently On Trip</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.onTrip}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active / Ready</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Licenses Expiring Soon</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.expiringLicense}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, license, phone..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={DRIVER_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable
          columns={columns} data={drivers} keyField={(d) => d.id}
          onRowClick={(d) => navigate(`/app/fleet/drivers/${d.id}`)} loading={loading} pageSize={drivers.length || 8}
          emptyTitle="No drivers yet" emptyDescription="Add your first driver to start assigning jobs."
        />
      </Card>

      <NewDriverModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => load()} />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, Plus, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { drivers } from '@/data/drivers';
import { getVehicle } from '@/data/vehicles';
import type { Driver } from '@/data/types';
import { cn, formatDate } from '@/lib/utils';

const STATUS_OPTIONS = ['Active', 'On Trip', 'Off Duty', 'On Leave', 'Suspended'];
const AVATAR_COLORS = ['#365D90', '#0D9488', '#B45309', '#7C3AED', '#0284C7', '#BE123C'];

export function DriverList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => drivers.filter((d) => {
    if (status && d.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${d.name} ${d.licenseNumber} ${d.phone}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const summary = useMemo(() => ({
    total: drivers.length,
    onTrip: drivers.filter((d) => d.status === 'On Trip').length,
    avgRating: (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1),
    expiringLicense: drivers.filter((d) => new Date(d.licenseExpiry) < new Date('2026-12-01')).length,
  }), []);

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Driver', accessor: (d) => d.name, sortable: true, render: (d) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={d.name} color={AVATAR_COLORS[d.id.charCodeAt(4) % AVATAR_COLORS.length]} size="sm" />
        <div>
          <p className="font-medium text-brand-950">{d.name}</p>
          <p className="text-xs text-slate-400">{d.id} · {d.nationality}</p>
        </div>
      </div>
    ) },
    { key: 'phone', header: 'Contact', accessor: (d) => d.phone, render: (d) => <span className="text-slate-600">{d.phone}</span> },
    { key: 'license', header: 'License #', render: (d) => <span className="text-slate-600">{d.licenseNumber}</span> },
    { key: 'expiry', header: 'License Expiry', accessor: (d) => d.licenseExpiry, sortable: true, render: (d) => {
      const soon = new Date(d.licenseExpiry) < new Date('2026-12-01');
      return <span className={cn(soon ? 'font-medium text-amber-600' : 'text-slate-600')}>{formatDate(d.licenseExpiry, 'short')}</span>;
    } },
    { key: 'vehicle', header: 'Assigned Vehicle', render: (d) => {
      const v = getVehicle(d.assignedVehicleId);
      return v ? <span className="text-slate-600">{v.unitNumber}</span> : <span className="text-xs text-slate-400">Unassigned</span>;
    } },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'trips', header: 'Trips', align: 'right', accessor: (d) => d.totalTrips, sortable: true, render: (d) => d.totalTrips.toLocaleString() },
    { key: 'rating', header: 'Rating', align: 'right', render: (d) => <span className="inline-flex items-center gap-1 font-medium text-brand-950"><Star size={12} className="fill-amber-400 text-amber-400" />{d.rating}</span> },
    { key: 'incidents', header: 'Incidents', align: 'center', render: (d) => d.incidents > 0 ? <span className="inline-flex items-center gap-1 font-medium text-rose-600"><AlertTriangle size={12} />{d.incidents}</span> : <span className="text-slate-300">0</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Driver roster with licensing, assignment, and performance overview."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>Add Driver</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Drivers</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Currently On Trip</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.onTrip}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Rating</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.avgRating}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Licenses Expiring Soon</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.expiringLicense}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, license, phone..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>
        )}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(d) => d.id} onRowClick={(d) => navigate(`/fleet/drivers/${d.id}`)} pageSize={8} />
      </Card>
    </div>
  );
}

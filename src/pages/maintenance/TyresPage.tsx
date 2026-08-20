import { useMemo, useState } from 'react';
import { Disc, Download, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { tyres } from '@/data/tyres';
import { getVehicle } from '@/data/vehicles';
import type { Tyre } from '@/data/types';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_OPTIONS = ['In Service', 'In Stock', 'Retreaded', 'Scrapped'];

export function TyresPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => tyres.filter((t) => {
    if (status && t.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${t.brand} ${t.serial} ${getVehicle(t.vehicleId)?.unitNumber}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const summary = useMemo(() => ({
    inService: tyres.filter((t) => t.status === 'In Service').length,
    inStock: tyres.filter((t) => t.status === 'In Stock').length,
    avgTread: (tyres.filter((t) => t.status === 'In Service').reduce((s, t) => s + t.treadDepth, 0) / Math.max(1, tyres.filter((t) => t.status === 'In Service').length)).toFixed(1),
    lowTread: tyres.filter((t) => t.status === 'In Service' && t.treadDepth < 4).length,
  }), []);

  const columns: Column<Tyre>[] = [
    { key: 'serial', header: 'Tyre', render: (t) => (
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Disc size={14} /></span>
        <div>
          <p className="font-medium text-brand-950">{t.brand}</p>
          <p className="text-xs text-slate-400">{t.serial} · {t.size}</p>
        </div>
      </div>
    ) },
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicleId ? <span className="text-slate-600">{getVehicle(t.vehicleId)?.unitNumber}</span> : <span className="text-xs text-slate-400">Warehouse</span> },
    { key: 'position', header: 'Position', render: (t) => <span className="text-slate-600">{t.position}</span> },
    { key: 'tread', header: 'Tread Depth', render: (t) => {
      const pct = Math.min(100, (t.treadDepth / 14) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <span className={cn('block h-full rounded-full', t.treadDepth > 6 ? 'bg-emerald-500' : t.treadDepth > 3 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-slate-500">{t.treadDepth} mm</span>
        </div>
      );
    } },
    { key: 'installKm', header: 'Install KM', align: 'right', render: (t) => t.installKm.toLocaleString() },
    { key: 'removalKm', header: 'Removal KM', align: 'right', render: (t) => t.removalKm ? t.removalKm.toLocaleString() : '—' },
    { key: 'cost', header: 'Cost', align: 'right', accessor: (t) => t.cost, sortable: true, render: (t) => formatCurrency(t.cost) },
    { key: 'costPerKm', header: 'Cost / KM', align: 'right', render: (t) => {
      const km = (t.removalKm ?? 0) - t.installKm;
      return km > 0 ? `${(t.cost / km).toFixed(2)} AED` : '—';
    } },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Tyre Management"
        description="Tyre lifecycle tracking from installation through retreading or replacement."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Tyres' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>Record Tyre Change</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Service</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.inService}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Stock</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.inStock}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Tread Depth</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.avgTread} mm</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Low Tread (&lt;4mm)</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.lowTread}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search brand, serial, vehicle..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(t) => t.id} pageSize={10} />
      </Card>
    </div>
  );
}

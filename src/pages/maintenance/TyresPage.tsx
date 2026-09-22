import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Disc, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select as FieldSelect } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, TYRE_STATUSES, type Tyre, type Vehicle } from '@/lib/opsApi';
import { cn, formatCurrency } from '@/lib/utils';

export function TyresPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.tyres.list(), opsApi.vehicles.list({ limit: 200 })])
      .then(([t, v]) => { setTyres(t.items); setVehicles(v.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = useMemo(() => tyres.filter((t) => {
    if (status && t.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${t.brand} ${t.serial} ${t.vehicleRef ?? ''}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [tyres, search, status]);

  const inService = tyres.filter((t) => t.status === 'In Service');
  const summary = {
    inService: inService.length,
    inStock: tyres.filter((t) => t.status === 'In Stock').length,
    avgTread: inService.length ? (inService.reduce((s, t) => s + (t.treadDepth ?? 0), 0) / inService.length).toFixed(1) : '—',
    lowTread: inService.filter((t) => (t.treadDepth ?? 99) < 4).length,
  };

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
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicleRef ? <span className="text-slate-600">{t.vehicleRef}</span> : <span className="text-xs text-slate-400">Warehouse</span> },
    { key: 'position', header: 'Position', render: (t) => <span className="text-slate-600">{t.position ?? '—'}</span> },
    { key: 'tread', header: 'Tread Depth', render: (t) => {
      const depth = t.treadDepth ?? 0;
      const pct = Math.min(100, (depth / 14) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <span className={cn('block h-full rounded-full', depth > 6 ? 'bg-emerald-500' : depth > 3 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-slate-500">{depth} mm</span>
        </div>
      );
    } },
    { key: 'cost', header: 'Cost', align: 'right', render: (t) => t.cost != null ? formatCurrency(t.cost) : '—' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.tyres.create(body);
      toast({ type: 'success', title: 'Tyre recorded' });
      setShowNew(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not record tyre', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tyre Management"
        description="Tyre lifecycle tracking from installation through retreading or replacement."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Tyres' }]}
        actions={can('maintenance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>Record Tyre</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Service</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.inService}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">In Stock</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.inStock}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Tread Depth</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.avgTread} mm</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Low Tread (&lt;4mm)</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.lowTread}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search brand, serial, vehicle..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={TYRE_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(t) => t.id} loading={loading} pageSize={filtered.length || 10} emptyTitle="No tyres recorded yet" />
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Record a tyre" size="sm">
        <form id="new-tyre-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Brand" required><Input name="brand" required /></Field>
          <Field label="Size" required><Input name="size" required placeholder="295/80R22.5" /></Field>
          <Field label="Serial" required><Input name="serial" required /></Field>
          <Field label="Vehicle (leave blank for warehouse stock)">
            <FieldSelect name="vehicleId" options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Warehouse" />
          </Field>
          <Field label="Position"><Input name="position" placeholder="Front Left" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Install KM"><Input name="installKm" type="number" /></Field>
            <Field label="Tread Depth (mm)"><Input name="treadDepth" type="number" step="0.1" /></Field>
          </div>
          <Field label="Cost"><Input name="cost" type="number" /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button form="new-tyre-form" type="submit" loading={submitting}>Save tyre</Button>
        </div>
      </Modal>
    </div>
  );
}

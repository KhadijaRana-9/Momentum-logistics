import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select as FieldSelect, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, MAINTENANCE_STATUSES, MAINTENANCE_CATEGORIES, type MaintenanceOrder, type Vehicle, type Workshop } from '@/lib/opsApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function MaintenancePage() {
  const { can } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.maintenance.list({ limit: 300, status: status || undefined }), opsApi.vehicles.list({ limit: 200 }), opsApi.workshops.list()])
      .then(([o, v, w]) => { setOrders(o.items); setVehicles(v.items); setWorkshops(w.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, [status]);

  const pmDue = useMemo(() => {
    const soon = new Date(); soon.setDate(soon.getDate() + 14);
    return vehicles.filter((v) => v.nextServiceDue && new Date(v.nextServiceDue) <= soon).sort((a, b) => new Date(a.nextServiceDue!).getTime() - new Date(b.nextServiceDue!).getTime());
  }, [vehicles]);

  const filtered = useMemo(() => orders.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${m.ref} ${m.problem} ${m.vehicleRef}`.toLowerCase().includes(q);
  }), [orders, search]);

  const summary = useMemo(() => ({
    active: orders.filter((m) => m.status === 'In Progress' || m.status === 'Scheduled').length,
    totalCost: orders.reduce((s, m) => s + m.totalCost, 0),
    awaitingParts: orders.filter((m) => m.status === 'Awaiting Parts').length,
    pmDue: pmDue.length,
  }), [orders, pmDue]);

  const columns: Column<MaintenanceOrder>[] = [
    { key: 'ref', header: 'WO #', render: (m) => <span className="font-semibold text-brand-800">{m.ref}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (m) => <span className="text-slate-700">{m.vehicleRef}</span> },
    { key: 'category', header: 'Category', render: (m) => <span className="text-slate-600">{m.category}</span> },
    { key: 'problem', header: 'Problem', render: (m) => <span className="max-w-[240px] truncate text-slate-600">{m.problem}</span> },
    { key: 'workshop', header: 'Workshop', render: (m) => <span className="text-slate-600">{m.workshopName}</span> },
    { key: 'start', header: 'Start Date', render: (m) => formatDate(m.startDate, 'short') },
    { key: 'cost', header: 'Cost', align: 'right', render: (m) => <span className="font-semibold text-brand-950">{formatCurrency(m.totalCost)}</span> },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.maintenance.create(body);
      toast({ type: 'success', title: 'Work order created' });
      setShowNew(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not create work order', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Work orders, preventive maintenance schedules, and repair tracking across the fleet."
        breadcrumbs={[{ label: 'Maintenance' }]}
        actions={can('maintenance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>New Work Order</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active Work Orders</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Maintenance Cost</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.totalCost, { compact: true })}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Awaiting Parts</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.awaitingParts}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">PM Due (14 days)</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.pmDue}</p></Card>
      </div>

      {pmDue.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Preventive Maintenance Due" subtitle="Vehicles approaching their scheduled service interval" />
          <div className="flex gap-3 overflow-x-auto px-5 pb-5">
            {pmDue.map((v) => (
              <div key={v.id} className="flex w-56 shrink-0 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><AlertTriangle size={16} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{v.unitNumber}</p>
                  <p className="text-xs text-amber-700">Due {formatDate(v.nextServiceDue!, 'short')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search WO #, vehicle, problem..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={MAINTENANCE_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(m) => m.id} loading={loading} pageSize={filtered.length || 8} emptyTitle="No work orders yet" />
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New work order" size="sm">
        <form id="new-wo-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Vehicle" required>
            <FieldSelect name="vehicleId" required options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Select vehicle" />
          </Field>
          <Field label="Workshop" required>
            <FieldSelect name="workshopId" required options={workshops.map((w) => ({ label: w.name, value: w.id }))} placeholder="Select workshop" />
          </Field>
          <Field label="Category" required>
            <FieldSelect name="category" required options={MAINTENANCE_CATEGORIES.map((c) => ({ label: c, value: c }))} placeholder="Select category" />
          </Field>
          <Field label="Problem" required><Textarea name="problem" required rows={2} /></Field>
          <Field label="Labour Cost"><Input name="labourCost" type="number" defaultValue={0} /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button form="new-wo-form" type="submit" loading={submitting}>Create work order</Button>
        </div>
      </Modal>
    </div>
  );
}

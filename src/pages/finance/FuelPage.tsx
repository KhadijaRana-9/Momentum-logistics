import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, FUEL_TYPES, type FuelVoucher, type Driver, type Vehicle } from '@/lib/opsApi';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export function FuelPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [fuel, setFuel] = useState<FuelVoucher[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.fuel.list({ limit: 300 }), opsApi.drivers.list({ limit: 200 }), opsApi.vehicles.list({ limit: 200 })])
      .then(([f, d, v]) => { setFuel(f.items); setDrivers(d.items); setVehicles(v.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = useMemo(() => fuel.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${f.ref} ${f.station ?? ''} ${f.vehicleRef}`.toLowerCase().includes(q);
  }), [fuel, search]);

  const summary = useMemo(() => ({
    totalLitres: fuel.reduce((s, f) => s + f.litres, 0),
    totalCost: fuel.reduce((s, f) => s + f.total, 0),
    avgRate: fuel.length ? fuel.reduce((s, f) => s + f.rate, 0) / fuel.length : 0,
  }), [fuel]);

  const columns: Column<FuelVoucher>[] = [
    { key: 'ref', header: 'Voucher #', render: (f) => <span className="font-semibold text-brand-800">{f.ref}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (f) => <span className="text-slate-700">{f.vehicleRef}</span> },
    { key: 'driver', header: 'Driver', render: (f) => <span className="text-slate-600">{f.driverName ?? '—'}</span> },
    { key: 'station', header: 'Fuel Station', render: (f) => <span className="max-w-[200px] truncate text-slate-600">{f.station ?? '—'}</span> },
    { key: 'date', header: 'Date', render: (f) => formatDate(f.date, 'short') },
    { key: 'litres', header: 'Litres', align: 'right', render: (f) => `${formatNumber(f.litres)} L` },
    { key: 'rate', header: 'Rate', align: 'right', render: (f) => formatCurrency(f.rate) },
    { key: 'total', header: 'Total', align: 'right', render: (f) => <span className="font-semibold text-brand-950">{formatCurrency(f.total)}</span> },
    { key: 'trip', header: 'Trip', render: (f) => <span className="text-slate-500">{f.tripRef ?? '—'}</span> },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.fuel.create(body);
      toast({ type: 'success', title: 'Fuel voucher recorded' });
      setNewOpen(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not record voucher', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fuel"
        description="Track fuel purchases across the fleet with cost visibility."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Fuel' }]}
        actions={can('finance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New Fuel Voucher</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Litres</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatNumber(summary.totalLitres)} L</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Fuel Cost</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{formatCurrency(summary.totalCost)}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Rate / Litre</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.avgRate)}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search voucher #, vehicle, station..." className="sm:max-w-xs" />
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(f) => f.id} loading={loading} pageSize={filtered.length || 8} emptyTitle="No fuel vouchers yet" />
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Fuel Voucher" subtitle="Record a fuel purchase" size="md">
        <form id="new-fuel-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field label="Vehicle" required><Select name="vehicleId" required options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Select vehicle" /></Field>
          <Field label="Driver"><Select name="driverId" options={drivers.map((d) => ({ label: d.name, value: d.id }))} placeholder="Select driver" /></Field>
          <Field label="Fuel Station"><Input name="station" placeholder="e.g. ADNOC — Jebel Ali" /></Field>
          <Field label="Date" required><Input name="date" type="date" required /></Field>
          <Field label="Odometer (km)"><Input name="odometer" type="number" /></Field>
          <Field label="Fuel Type"><Select name="fuelType" defaultValue="Diesel" options={FUEL_TYPES.map((t) => ({ label: t, value: t }))} /></Field>
          <Field label="Litres" required><Input name="litres" type="number" step="0.1" required /></Field>
          <Field label="Rate / Litre (AED)" required><Input name="rate" type="number" step="0.01" required /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button form="new-fuel-form" type="submit" loading={submitting}>Save Voucher</Button>
        </div>
      </Modal>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Check, Download, Paperclip, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { fuelVouchers } from '@/data/fuel';
import { getDriver, drivers } from '@/data/drivers';
import { getVehicle, vehicles } from '@/data/vehicles';
import type { FuelVoucher } from '@/data/types';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export function FuelPage() {
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => fuelVouchers.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${f.id} ${f.station} ${getVehicle(f.vehicleId)?.unitNumber}`.toLowerCase().includes(q);
  }), [search]);

  const summary = useMemo(() => ({
    totalLitres: fuelVouchers.reduce((s, f) => s + f.litres, 0),
    totalCost: fuelVouchers.reduce((s, f) => s + f.total, 0),
    avgRate: fuelVouchers.reduce((s, f) => s + f.rate, 0) / fuelVouchers.length,
    withoutReceipt: fuelVouchers.filter((f) => !f.receiptAttached).length,
  }), []);

  const columns: Column<FuelVoucher>[] = [
    { key: 'id', header: 'Voucher #', render: (f) => <span className="font-semibold text-brand-800">{f.id}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (f) => <span className="text-slate-700">{getVehicle(f.vehicleId)?.unitNumber}</span> },
    { key: 'driver', header: 'Driver', render: (f) => <span className="text-slate-600">{getDriver(f.driverId)?.name}</span> },
    { key: 'station', header: 'Fuel Station', render: (f) => <span className="max-w-[200px] truncate text-slate-600">{f.station}</span> },
    { key: 'date', header: 'Date', accessor: (f) => f.date, sortable: true, render: (f) => formatDate(f.date, 'short') },
    { key: 'odometer', header: 'Odometer', align: 'right', render: (f) => `${f.odometer.toLocaleString()} km` },
    { key: 'litres', header: 'Litres', align: 'right', accessor: (f) => f.litres, sortable: true, render: (f) => `${formatNumber(f.litres)} L` },
    { key: 'rate', header: 'Rate', align: 'right', render: (f) => formatCurrency(f.rate) },
    { key: 'total', header: 'Total', align: 'right', accessor: (f) => f.total, sortable: true, render: (f) => <span className="font-semibold text-brand-950">{formatCurrency(f.total)}</span> },
    { key: 'receipt', header: 'Receipt', align: 'center', render: (f) => f.receiptAttached ? <Paperclip size={13} className="mx-auto text-emerald-500" /> : <span className="text-xs text-rose-500">Missing</span> },
    { key: 'trip', header: 'Trip', render: (f) => <span className="text-slate-500">{f.tripId ?? '—'}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Fuel"
        description="Track fuel purchases across the fleet with consumption and cost visibility."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Fuel' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New Fuel Voucher</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Litres</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatNumber(summary.totalLitres)} L</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Fuel Cost</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{formatCurrency(summary.totalCost)}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Avg. Rate / Litre</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.avgRate)}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Missing Receipts</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.withoutReceipt}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search voucher #, vehicle, station..." className="sm:max-w-xs" />
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(f) => f.id} pageSize={8} />
      </Card>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Fuel Voucher"
        subtitle="Record a fuel purchase"
        footer={<>
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button variant="primary" icon={Check} onClick={() => { toast({ type: 'success', title: 'Fuel voucher recorded' }); setNewOpen(false); }}>Save Voucher</Button>
        </>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vehicle" required><Select required options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Select vehicle" /></Field>
          <Field label="Driver" required><Select required options={drivers.map((d) => ({ label: d.name, value: d.id }))} placeholder="Select driver" /></Field>
          <Field label="Fuel Station" required><Input placeholder="e.g. ADNOC — Jebel Ali" required /></Field>
          <Field label="Date" required><Input type="date" defaultValue="2026-08-20" required /></Field>
          <Field label="Odometer (km)" required><Input type="number" required /></Field>
          <Field label="Fuel Type"><Select defaultValue="Diesel" options={[{ label: 'Diesel', value: 'Diesel' }, { label: 'Petrol', value: 'Petrol' }]} /></Field>
          <Field label="Litres" required><Input type="number" step="0.1" required /></Field>
          <Field label="Rate / Litre (AED)" required><Input type="number" step="0.01" required /></Field>
          <Field label="Trip Reference"><Input placeholder="e.g. TRP-2026-0203" /></Field>
          <Field label="Receipt">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2">
              <Paperclip size={14} className="text-slate-400" />
              <span className="flex-1 text-xs text-slate-500">Attach receipt</span>
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

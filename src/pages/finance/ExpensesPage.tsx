import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, Field, Input, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, EXPENSE_CATEGORIES, EXPENSE_STATUSES, type Expense, type Driver, type Vehicle } from '@/lib/opsApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ExpensesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.expenses.list({ limit: 300, status: status || undefined }), opsApi.drivers.list({ limit: 200 }), opsApi.vehicles.list({ limit: 200 })])
      .then(([e, d, v]) => { setExpenses(e.items); setDrivers(d.items); setVehicles(v.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, [status]);

  const filtered = useMemo(() => expenses.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${e.ref} ${e.category} ${e.description ?? ''}`.toLowerCase().includes(q);
  }), [expenses, search]);

  const summary = useMemo(() => ({
    total: expenses.reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter((e) => e.approvalStatus === 'Pending').length,
    reimbursed: expenses.filter((e) => e.approvalStatus === 'Reimbursed').reduce((s, e) => s + e.amount, 0),
  }), [expenses]);

  const columns: Column<Expense>[] = [
    { key: 'ref', header: 'Voucher #', render: (e) => <span className="font-semibold text-brand-800">{e.ref}</span> },
    { key: 'category', header: 'Category', render: (e) => <span className="text-slate-700">{e.category}</span> },
    { key: 'description', header: 'Description', render: (e) => <span className="max-w-[220px] truncate text-slate-500">{e.description ?? '—'}</span> },
    { key: 'driver', header: 'Driver', render: (e) => <span className="text-slate-600">{e.driverName ?? '—'}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (e) => <span className="text-slate-600">{e.vehicleRef ?? '—'}</span> },
    { key: 'trip', header: 'Trip', render: (e) => <span className="text-slate-500">{e.tripRef ?? '—'}</span> },
    { key: 'date', header: 'Date', render: (e) => formatDate(e.date, 'short') },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <span className="font-semibold text-brand-950">{formatCurrency(e.amount)}</span> },
    { key: 'status', header: 'Status', render: (e) => can('finance:manage')
      ? <select value={e.approvalStatus} onChange={(ev) => setStatusFor(e.id, ev.target.value)} onClick={(ev) => ev.stopPropagation()} className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px]">
          {EXPENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      : <StatusBadge status={e.approvalStatus} /> },
  ];

  async function setStatusFor(id: string, approvalStatus: string) {
    try {
      const updated = await opsApi.expenses.setStatus(id, approvalStatus);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast({ type: 'success', title: `Expense ${approvalStatus}` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update expense', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.expenses.create(body);
      toast({ type: 'success', title: 'Expense voucher submitted', description: 'Sent for approval' });
      setNewOpen(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not submit voucher', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Review and approve driver and vehicle expense vouchers."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Expenses' }]}
        actions={can('finance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New Voucher</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Expenses</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.total)}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Pending Approval</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.pending}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Reimbursed</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(summary.reimbursed)}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search voucher #, category, description..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={EXPENSE_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(e) => e.id} loading={loading} pageSize={filtered.length || 8} emptyTitle="No expenses yet" />
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Expense Voucher" subtitle="Record a driver or vehicle expense" size="md">
        <form id="new-expense-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field label="Category" required><Select name="category" required options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))} placeholder="Select category" /></Field>
          <Field label="Amount (AED)" required><Input name="amount" type="number" placeholder="0.00" required /></Field>
          <Field label="Driver"><Select name="driverId" options={drivers.map((d) => ({ label: d.name, value: d.id }))} placeholder="Select driver" /></Field>
          <Field label="Vehicle"><Select name="vehicleId" options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Select vehicle" /></Field>
          <Field label="Date" required><Input name="date" type="date" required /></Field>
          <div />
          <Field label="Description" span="full"><Textarea name="description" placeholder="Brief description of the expense..." /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button form="new-expense-form" type="submit" loading={submitting}>Submit</Button>
        </div>
      </Modal>
    </div>
  );
}

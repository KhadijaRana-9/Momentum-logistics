import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Download, Paperclip, Plus } from 'lucide-react';
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
import { expenseVouchers } from '@/data/expenses';
import { getDriver, drivers } from '@/data/drivers';
import { getVehicle, vehicles } from '@/data/vehicles';
import type { ExpenseVoucher } from '@/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES = ['Tolls & Parking', 'Driver Meals', 'Loading/Unloading', 'Vehicle Wash', 'Driver Advance', 'Miscellaneous'];
const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Reimbursed'];

export function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => expenseVouchers.filter((e) => {
    if (status && e.approvalStatus !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${e.id} ${e.category} ${e.description}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const summary = useMemo(() => ({
    total: expenseVouchers.reduce((s, e) => s + e.amount, 0),
    pending: expenseVouchers.filter((e) => e.approvalStatus === 'Pending').length,
    flagged: expenseVouchers.filter((e) => e.flagged).length,
    reimbursed: expenseVouchers.filter((e) => e.approvalStatus === 'Reimbursed').reduce((s, e) => s + e.amount, 0),
  }), []);

  const columns: Column<ExpenseVoucher>[] = [
    { key: 'id', header: 'Voucher #', render: (e) => (
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-brand-800">{e.id}</span>
        {e.flagged && <AlertTriangle size={13} className="text-amber-500" />}
      </div>
    ) },
    { key: 'category', header: 'Category', render: (e) => <span className="text-slate-700">{e.category}</span> },
    { key: 'description', header: 'Description', render: (e) => <span className="max-w-[220px] truncate text-slate-500">{e.description}</span> },
    { key: 'driver', header: 'Driver', render: (e) => <span className="text-slate-600">{getDriver(e.driverId)?.name}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (e) => <span className="text-slate-600">{getVehicle(e.vehicleId)?.unitNumber ?? '—'}</span> },
    { key: 'trip', header: 'Trip', render: (e) => <span className="text-slate-500">{e.tripId ?? '—'}</span> },
    { key: 'date', header: 'Date', accessor: (e) => e.date, sortable: true, render: (e) => formatDate(e.date, 'short') },
    { key: 'receipt', header: 'Receipt', align: 'center', render: (e) => e.receiptAttached ? <Paperclip size={13} className="mx-auto text-emerald-500" /> : <span className="text-slate-300">—</span> },
    { key: 'amount', header: 'Amount', align: 'right', accessor: (e) => e.amount, sortable: true, render: (e) => <span className="font-semibold text-brand-950">{formatCurrency(e.amount)}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.approvalStatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Review and approve driver and vehicle expense vouchers."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Expenses' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New Voucher</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Expenses</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.total)}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Pending Approval</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.pending}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Flagged / Anomalies</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.flagged}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Reimbursed</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(summary.reimbursed)}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search voucher #, category, description..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(e) => e.id} pageSize={8} />
      </Card>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Expense Voucher"
        subtitle="Record a driver or vehicle expense"
        footer={<>
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button variant="primary" icon={Check} onClick={() => { toast({ type: 'success', title: 'Expense voucher submitted', description: 'Sent for approval' }); setNewOpen(false); }}>Submit</Button>
        </>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" required><Select required options={CATEGORIES.map((c) => ({ label: c, value: c }))} placeholder="Select category" /></Field>
          <Field label="Amount (AED)" required><Input type="number" placeholder="0.00" required /></Field>
          <Field label="Driver" required><Select required options={drivers.map((d) => ({ label: d.name, value: d.id }))} placeholder="Select driver" /></Field>
          <Field label="Vehicle"><Select options={vehicles.map((v) => ({ label: v.unitNumber, value: v.id }))} placeholder="Select vehicle" /></Field>
          <Field label="Date" required><Input type="date" defaultValue="2026-08-20" required /></Field>
          <Field label="Trip Reference"><Input placeholder="e.g. TRP-2026-0203" /></Field>
          <Field label="Description" span="full"><Textarea placeholder="Brief description of the expense..." /></Field>
          <Field label="Receipt" span="full">
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3">
              <Paperclip size={16} className="text-slate-400" />
              <span className="flex-1 text-[13px] text-slate-500">Attach receipt image or PDF</span>
              <Button type="button" variant="secondary" size="sm">Browse</Button>
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

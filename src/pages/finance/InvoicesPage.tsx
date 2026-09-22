import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Compass, Plus, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, INVOICE_STATUSES, type Invoice } from '@/lib/opsApi';
import { rrrApi, type RrrCustomer } from '@/pages/rrr/rrrApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function InvoicesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<RrrCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.invoices.list({ limit: 300, status: status || undefined }), rrrApi.customers()])
      .then(([i, c]) => { setInvoices(i.items); setCustomers(c.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, [status]);

  const filtered = useMemo(() => invoices.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${i.ref} ${i.customerName} ${i.contractRef ?? ''}`.toLowerCase().includes(q);
  }), [invoices, search]);

  const columns: Column<Invoice>[] = [
    { key: 'ref', header: 'Invoice #', render: (i) => <span className="font-semibold text-brand-800">{i.ref}</span> },
    { key: 'customer', header: 'Customer', render: (i) => <span className="font-medium text-brand-950">{i.customerName}</span> },
    { key: 'contract', header: 'Contract Ref', render: (i) => <span className="text-slate-500">{i.contractRef ?? '—'}</span> },
    { key: 'issueDate', header: 'Issue Date', render: (i) => formatDate(i.issueDate, 'short') },
    { key: 'dueDate', header: 'Due Date', render: (i) => formatDate(i.dueDate, 'short') },
    { key: 'total', header: 'Total', align: 'right', render: (i) => <span className="font-semibold text-brand-950">{formatCurrency(i.total)}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries([...fd.entries()]);
    const body = {
      customerId: raw.customerId,
      contractRef: raw.contractRef || undefined,
      taxRate: raw.taxRate ? Number(raw.taxRate) : 5,
      discount: raw.discount ? Number(raw.discount) : 0,
      dueDate: raw.dueDate || undefined,
      charges: [{ description: raw.chargeDescription, amount: Number(raw.chargeAmount) }],
    };
    try {
      await opsApi.invoices.create(body);
      toast({ type: 'success', title: 'Invoice created' });
      setNewOpen(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not create invoice', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceStatus(inv: Invoice) {
    const order = INVOICE_STATUSES;
    const idx = order.indexOf(inv.status);
    const next = order[idx + 1];
    if (!next) return;
    try {
      const updated = await opsApi.invoices.setStatus(inv.id, next);
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
      setPreview(updated);
      toast({ type: 'success', title: `Invoice ${next}` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update invoice', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Customer invoices — create and progress through approval to payment."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}
        actions={can('finance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New Invoice</Button> : undefined}
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice #, customer, contract..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={INVOICE_STATUSES.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(i) => i.id} onRowClick={setPreview} loading={loading} pageSize={filtered.length || 8} emptyTitle="No invoices yet" />
      </Card>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        width="lg"
        title={preview?.ref}
        subtitle="Invoice preview"
        footer={<>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {preview && can('finance:manage') && INVOICE_STATUSES.indexOf(preview.status) < INVOICE_STATUSES.indexOf('Paid') && (
            <Button variant="primary" onClick={() => advanceStatus(preview)}>Mark as {INVOICE_STATUSES[INVOICE_STATUSES.indexOf(preview.status) + 1]}</Button>
          )}
        </>}
      >
        {preview && <InvoiceDocument invoice={preview} />}
      </Drawer>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Invoice" size="md">
        <form id="new-invoice-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field label="Customer" required><Select name="customerId" required options={customers.map((c) => ({ label: c.name, value: c.id }))} placeholder="Select customer" /></Field>
          <Field label="Contract Ref"><Input name="contractRef" /></Field>
          <Field label="Charge Description" required><Input name="chargeDescription" required placeholder="Freight — ..." /></Field>
          <Field label="Charge Amount (AED)" required><Input name="chargeAmount" type="number" required /></Field>
          <Field label="Discount"><Input name="discount" type="number" defaultValue={0} /></Field>
          <Field label="Tax Rate (%)"><Input name="taxRate" type="number" defaultValue={5} /></Field>
          <Field label="Due Date"><Input name="dueDate" type="date" /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button form="new-invoice-form" type="submit" loading={submitting}>Create invoice</Button>
        </div>
      </Modal>
    </div>
  );
}

function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <div className="flex items-start justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600"><Compass size={18} className="text-white" /></span>
          <div>
            <p className="font-display text-[15px] font-bold text-brand-950">Momentum Logistics</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold text-brand-950">INVOICE</p>
          <p className="text-[13px] font-medium text-slate-500">{invoice.ref}</p>
          <div className="mt-1.5"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-slate-100 py-6">
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
          <p className="text-[13.5px] font-semibold text-brand-950">{invoice.customerName}</p>
        </div>
        <div className="text-right">
          <div className="mb-1 flex justify-end gap-8 text-xs"><span className="text-slate-400">Issue Date</span><span className="w-24 font-medium text-brand-950">{formatDate(invoice.issueDate)}</span></div>
          <div className="mb-1 flex justify-end gap-8 text-xs"><span className="text-slate-400">Due Date</span><span className="w-24 font-medium text-brand-950">{formatDate(invoice.dueDate)}</span></div>
          {invoice.contractRef && <div className="flex justify-end gap-8 text-xs"><span className="text-slate-400">Contract Ref</span><span className="w-24 font-medium text-brand-950">{invoice.contractRef}</span></div>}
        </div>
      </div>

      <table className="w-full text-left text-[13px]">
        <thead><tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400"><th className="py-2 font-semibold">Description</th><th className="py-2 text-right font-semibold">Amount</th></tr></thead>
        <tbody>
          {invoice.charges.map((c, i) => (
            <tr key={i} className="border-b border-slate-50"><td className="py-2.5 text-slate-700">{c.description}</td><td className="py-2.5 text-right font-medium text-brand-950">{formatCurrency(c.amount)}</td></tr>
          ))}
          {invoice.additionalCharges.map((c, i) => (
            <tr key={`a${i}`} className="border-b border-slate-50"><td className="py-2.5 text-slate-500">{c.description}</td><td className="py-2.5 text-right font-medium text-brand-950">{formatCurrency(c.amount)}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 flex w-56 flex-col gap-1.5 text-[13px]">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-brand-950">{formatCurrency(invoice.subtotal)}</span></div>
        {invoice.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-rose-500">-{formatCurrency(invoice.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-slate-500">VAT ({invoice.taxRate}%)</span><span className="font-medium text-brand-950">{formatCurrency(invoice.tax)}</span></div>
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-[15px] font-bold"><span className="text-brand-950">Total Due</span><span className="text-brand-950">{formatCurrency(invoice.total)}</span></div>
      </div>
    </div>
  );
}

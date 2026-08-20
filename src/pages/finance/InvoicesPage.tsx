import { useMemo, useState } from 'react';
import { Compass, Download, Plus, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { invoices, invoiceSubtotal, invoiceTax, invoiceTotal } from '@/data/invoices';
import { getCustomer } from '@/data/customers';
import type { Invoice } from '@/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_OPTIONS = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Paid', 'Overdue', 'Disputed'];

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<Invoice | null>(null);

  const filtered = useMemo(() => invoices.filter((i) => {
    if (status && i.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${i.id} ${getCustomer(i.customerId)?.name} ${i.contractRef}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const columns: Column<Invoice>[] = [
    { key: 'id', header: 'Invoice #', render: (i) => <span className="font-semibold text-brand-800">{i.id}</span> },
    { key: 'customer', header: 'Customer', render: (i) => <span className="font-medium text-brand-950">{getCustomer(i.customerId)?.name}</span> },
    { key: 'contract', header: 'Contract Ref', render: (i) => <span className="text-slate-500">{i.contractRef}</span> },
    { key: 'issueDate', header: 'Issue Date', accessor: (i) => i.issueDate, sortable: true, render: (i) => formatDate(i.issueDate, 'short') },
    { key: 'dueDate', header: 'Due Date', render: (i) => formatDate(i.dueDate, 'short') },
    { key: 'total', header: 'Total', align: 'right', accessor: (i) => invoiceTotal(i), sortable: true, render: (i) => <span className="font-semibold text-brand-950">{formatCurrency(invoiceTotal(i))}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Customer invoices generated from completed jobs and trips."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>New Invoice</Button>
        </>}
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice #, customer, contract..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(i) => i.id} onRowClick={setPreview} pageSize={8} />
      </Card>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        width="lg"
        title={preview?.id}
        subtitle="Invoice preview"
        footer={<>
          <Button variant="secondary" icon={Download}>Download PDF</Button>
          <Button variant="primary" icon={Printer}>Print</Button>
        </>}
      >
        {preview && <InvoiceDocument invoice={preview} />}
      </Drawer>
    </div>
  );
}

function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const customer = getCustomer(invoice.customerId);
  const subtotal = invoiceSubtotal(invoice);
  const tax = invoiceTax(invoice);
  const total = invoiceTotal(invoice);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <div className="flex items-start justify-between border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600"><Compass size={18} className="text-white" /></span>
            <div>
              <p className="font-display text-[15px] font-bold text-brand-950">Momentum Logistics</p>
              <p className="text-[11px] text-slate-400">Dubai, United Arab Emirates</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold text-brand-950">INVOICE</p>
          <p className="text-[13px] font-medium text-slate-500">{invoice.id}</p>
          <div className="mt-1.5"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-slate-100 py-6">
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
          <p className="text-[13.5px] font-semibold text-brand-950">{customer?.name}</p>
          <p className="text-xs text-slate-500">{customer?.city}</p>
          <p className="text-xs text-slate-500">{customer?.contactName} — {customer?.contactPhone}</p>
        </div>
        <div className="text-right">
          <div className="mb-1 flex justify-end gap-8 text-xs">
            <span className="text-slate-400">Issue Date</span>
            <span className="w-20 font-medium text-brand-950">{formatDate(invoice.issueDate)}</span>
          </div>
          <div className="mb-1 flex justify-end gap-8 text-xs">
            <span className="text-slate-400">Due Date</span>
            <span className="w-20 font-medium text-brand-950">{formatDate(invoice.dueDate)}</span>
          </div>
          <div className="flex justify-end gap-8 text-xs">
            <span className="text-slate-400">Contract Ref</span>
            <span className="w-20 font-medium text-brand-950">{invoice.contractRef}</span>
          </div>
        </div>
      </div>

      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
            <th className="py-2 font-semibold">Description</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.charges.map((c, i) => (
            <tr key={i} className="border-b border-slate-50">
              <td className="py-2.5 text-slate-700">{c.description}</td>
              <td className="py-2.5 text-right font-medium text-brand-950">{formatCurrency(c.amount)}</td>
            </tr>
          ))}
          {invoice.additionalCharges.map((c, i) => (
            <tr key={`a${i}`} className="border-b border-slate-50">
              <td className="py-2.5 text-slate-500">{c.description}</td>
              <td className="py-2.5 text-right font-medium text-brand-950">{formatCurrency(c.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 flex w-56 flex-col gap-1.5 text-[13px]">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-brand-950">{formatCurrency(subtotal)}</span></div>
        {invoice.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-rose-500">-{formatCurrency(invoice.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-slate-500">VAT ({invoice.taxRate}%)</span><span className="font-medium text-brand-950">{formatCurrency(tax)}</span></div>
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-[15px] font-bold"><span className="text-brand-950">Total Due</span><span className="text-brand-950">{formatCurrency(total)}</span></div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
        Payment due within 30 days. Please reference the invoice number with your remittance. For queries, contact billing@momentumlogistics.com.
      </div>
    </div>
  );
}

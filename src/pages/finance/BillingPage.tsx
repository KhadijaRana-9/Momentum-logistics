import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { invoices, invoiceTotal } from '@/data/invoices';
import { customers } from '@/data/customers';
import { formatCurrency } from '@/lib/utils';

export function BillingPage() {
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
    const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotal(i), 0);
    const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + invoiceTotal(i), 0);
    const pending = invoices.filter((i) => i.status === 'Pending Approval' || i.status === 'Draft').length;
    return { totalBilled, paid, overdue, pending, collectionRate: (paid / totalBilled) * 100 };
  }, []);

  const customerBalances = useMemo(() => customers
    .map((c) => ({ customer: c, invoiceCount: invoices.filter((i) => i.customerId === c.id).length }))
    .filter((c) => c.customer.outstandingBalance > 0)
    .sort((a, b) => b.customer.outstandingBalance - a.customer.outstandingBalance)
    .slice(0, 8), []);

  const pipeline = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Paid', 'Overdue', 'Disputed'].map((status) => ({
    status,
    count: invoices.filter((i) => i.status === status).length,
    value: invoices.filter((i) => i.status === status).reduce((s, i) => s + invoiceTotal(i), 0),
  }));

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Revenue billing pipeline, customer balances, and collections overview."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Billing' }]}
        actions={<button onClick={() => navigate('/app/finance/invoices')} className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">View All Invoices <ArrowRight size={14} /></button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Total Billed" value={summary.totalBilled} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
        <KpiCard index={1} label="Collected" value={summary.paid} format={(n) => formatCurrency(n, { compact: true })} icon={CheckCircle2} accent="emerald" />
        <KpiCard index={2} label="Overdue" value={summary.overdue} format={(n) => formatCurrency(n, { compact: true })} icon={AlertCircle} accent="rose" />
        <KpiCard index={3} label="Collection Rate" value={summary.collectionRate} format={(n) => `${n.toFixed(0)}%`} icon={Clock} accent="sky" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Billing Pipeline" subtitle="Invoices by status" />
          <div className="flex flex-col gap-3 px-5 pb-5">
            {pipeline.map((p) => {
              const max = Math.max(...pipeline.map((x) => x.count), 1);
              return (
                <div key={p.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{p.status}</span>
                    <span className="text-slate-500">{p.count} — {formatCurrency(p.value, { compact: true })}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${(p.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Outstanding Balances" />
          <div className="flex flex-col divide-y divide-slate-100">
            {customerBalances.map(({ customer, invoiceCount }) => (
              <div key={customer.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-brand-950">{customer.name}</p>
                  <p className="text-[11px] text-slate-400">{invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-[12.5px] font-semibold text-rose-600">{formatCurrency(customer.outstandingBalance, { compact: true })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Recent Invoices" action={<button onClick={() => navigate('/app/finance/invoices')} className="text-xs font-medium text-brand-700 hover:underline">View all</button>} />
        <div className="divide-y divide-slate-100">
          {invoices.slice(0, 6).map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-brand-800">{inv.id}</p>
                <p className="truncate text-xs text-slate-400">{customers.find((c) => c.id === inv.customerId)?.name}</p>
              </div>
              <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(invoiceTotal(inv))}</span>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

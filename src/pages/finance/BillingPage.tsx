import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { opsApi, INVOICE_STATUSES, type Invoice } from '@/lib/opsApi';
import { formatCurrency } from '@/lib/utils';

export function BillingPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opsApi.invoices.list({ limit: 500 }).then((res) => setInvoices(res.items)).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.total, 0);
    const collectionRate = totalBilled ? (paid / totalBilled) * 100 : 0;
    return { totalBilled, paid, overdue, collectionRate };
  }, [invoices]);

  const outstandingByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.status === 'Paid') continue;
      map.set(inv.customerName, (map.get(inv.customerName) ?? 0) + inv.total);
    }
    return [...map.entries()].map(([customer, amount]) => ({ customer, amount })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [invoices]);

  const pipeline = INVOICE_STATUSES.map((status) => ({
    status,
    count: invoices.filter((i) => i.status === status).length,
    value: invoices.filter((i) => i.status === status).reduce((s, i) => s + i.total, 0),
  }));
  const maxPipeline = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Revenue billing pipeline and collections overview."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Billing' }]}
        actions={<button onClick={() => navigate('/app/finance/invoices')} className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">View All Invoices <ArrowRight size={14} /></button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Total Billed" value={summary.totalBilled} format={(n) => formatCurrency(n, { compact: true })} icon={DollarSign} accent="brand" />
        <KpiCard index={1} label="Collected" value={summary.paid} format={(n) => formatCurrency(n, { compact: true })} icon={CheckCircle2} accent="emerald" />
        <KpiCard index={2} label="Overdue" value={summary.overdue} format={(n) => formatCurrency(n, { compact: true })} icon={AlertCircle} accent="rose" />
        <KpiCard index={3} label="Collection Rate" value={summary.collectionRate} format={(n) => `${n.toFixed(0)}%`} icon={Clock} accent="sky" />
      </div>

      {!loading && invoices.length === 0 && (
        <Card className="mt-5 p-6 text-center text-sm text-slate-400">No invoices yet — create one from Finance → Invoices.</Card>
      )}

      {invoices.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Billing Pipeline" subtitle="Invoices by status" />
            <div className="flex flex-col gap-3 px-5 pb-5">
              {pipeline.map((p) => (
                <div key={p.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{p.status}</span>
                    <span className="text-slate-500">{p.count} — {formatCurrency(p.value, { compact: true })}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${(p.count / maxPipeline) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Top Outstanding Balances" subtitle="Unpaid invoice totals by customer" />
            <div className="flex flex-col divide-y divide-slate-100">
              {outstandingByCustomer.map(({ customer, amount }) => (
                <div key={customer} className="flex items-center gap-3 px-5 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-brand-950">{customer}</p>
                  <span className="text-[12.5px] font-semibold text-rose-600">{formatCurrency(amount, { compact: true })}</span>
                </div>
              ))}
              {outstandingByCustomer.length === 0 && <p className="px-5 py-4 text-xs text-slate-400">Nothing outstanding.</p>}
            </div>
          </Card>
        </div>
      )}

      {invoices.length > 0 && (
        <Card className="mt-5">
          <CardHeader title="Recent Invoices" action={<button onClick={() => navigate('/app/finance/invoices')} className="text-xs font-medium text-brand-700 hover:underline">View all</button>} />
          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 6).map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-brand-800">{inv.ref}</p>
                  <p className="truncate text-xs text-slate-400">{inv.customerName}</p>
                </div>
                <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(inv.total)}</span>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

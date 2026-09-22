import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Package, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, type Part } from '@/lib/opsApi';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_OPTIONS = ['Healthy', 'Low', 'Critical', 'Out of Stock'];

export function PartsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    opsApi.parts.list().then((res) => setParts(res.items)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = useMemo(() => parts.filter((p) => {
    if (status && p.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${p.name} ${p.sku} ${p.supplier ?? ''}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [parts, search, status]);

  const summary = useMemo(() => ({
    total: parts.length,
    low: parts.filter((p) => p.status === 'Low').length,
    critical: parts.filter((p) => p.status === 'Critical' || p.status === 'Out of Stock').length,
    value: parts.reduce((s, p) => s + p.stock * p.unitCost, 0),
  }), [parts]);

  const columns: Column<Part>[] = [
    { key: 'name', header: 'Part', render: (p) => (
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Package size={14} /></span>
        <div>
          <p className="font-medium text-brand-950">{p.name}</p>
          <p className="text-xs text-slate-400">{p.sku}</p>
        </div>
      </div>
    ) },
    { key: 'category', header: 'Category', render: (p) => <span className="text-slate-600">{p.category ?? '—'}</span> },
    { key: 'supplier', header: 'Supplier', render: (p) => <span className="text-slate-600">{p.supplier ?? '—'}</span> },
    { key: 'stock', header: 'Stock Level', render: (p) => {
      const pct = Math.min(100, (p.stock / (p.minStock * 2 || 1)) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <span className={cn('block h-full rounded-full', p.status === 'Healthy' ? 'bg-emerald-500' : p.status === 'Low' ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-slate-500">{p.stock} / min {p.minStock}</span>
        </div>
      );
    } },
    { key: 'unitCost', header: 'Unit Cost', align: 'right', render: (p) => formatCurrency(p.unitCost) },
    { key: 'value', header: 'Stock Value', align: 'right', render: (p) => <span className="font-semibold text-brand-950">{formatCurrency(p.stock * p.unitCost)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.parts.create(body);
      toast({ type: 'success', title: 'Part added' });
      setShowNew(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not add part', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Parts & Inventory"
        description="Track spare parts stock levels, suppliers, and reorder requirements."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Parts' }]}
        actions={can('maintenance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>Add Part</Button> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total SKUs</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Low Stock</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.low}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Critical / Out of Stock</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.critical}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Inventory Value</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(summary.value, { compact: true })}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search part, SKU, supplier..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(p) => p.id} loading={loading} pageSize={filtered.length || 10} emptyTitle="No parts yet" />
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New part" size="sm">
        <form id="new-part-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" required><Input name="name" required /></Field>
          <Field label="SKU" required><Input name="sku" required /></Field>
          <Field label="Category"><Input name="category" /></Field>
          <Field label="Supplier"><Input name="supplier" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Stock"><Input name="stock" type="number" defaultValue={0} /></Field>
            <Field label="Min Stock"><Input name="minStock" type="number" defaultValue={1} /></Field>
            <Field label="Unit Cost" required><Input name="unitCost" type="number" required /></Field>
          </div>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button form="new-part-form" type="submit" loading={submitting}>Add part</Button>
        </div>
      </Modal>
    </div>
  );
}

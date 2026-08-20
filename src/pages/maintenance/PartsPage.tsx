import { useMemo, useState } from 'react';
import { Download, Package, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { parts } from '@/data/parts';
import type { Part } from '@/data/types';
import { cn, formatCurrency } from '@/lib/utils';

const CATEGORY_OPTIONS = Array.from(new Set(parts.map((p) => p.category)));
const STATUS_OPTIONS = ['Healthy', 'Low', 'Critical', 'Out of Stock'];

export function PartsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => parts.filter((p) => {
    if (category && p.category !== category) return false;
    if (status && p.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${p.name} ${p.sku} ${p.supplier}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, category, status]);

  const summary = useMemo(() => ({
    total: parts.length,
    low: parts.filter((p) => p.status === 'Low').length,
    critical: parts.filter((p) => p.status === 'Critical' || p.status === 'Out of Stock').length,
    value: parts.reduce((s, p) => s + p.stock * p.unitCost, 0),
  }), []);

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
    { key: 'category', header: 'Category', render: (p) => <span className="text-slate-600">{p.category}</span> },
    { key: 'supplier', header: 'Supplier', render: (p) => <span className="text-slate-600">{p.supplier}</span> },
    { key: 'stock', header: 'Stock Level', render: (p) => {
      const pct = Math.min(100, (p.stock / (p.minStock * 2)) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <span className={cn('block h-full rounded-full', p.status === 'Healthy' ? 'bg-emerald-500' : p.status === 'Low' ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-slate-500">{p.stock} / min {p.minStock}</span>
        </div>
      );
    } },
    { key: 'unitCost', header: 'Unit Cost', align: 'right', accessor: (p) => p.unitCost, sortable: true, render: (p) => formatCurrency(p.unitCost) },
    { key: 'value', header: 'Stock Value', align: 'right', accessor: (p) => p.stock * p.unitCost, sortable: true, render: (p) => <span className="font-semibold text-brand-950">{formatCurrency(p.stock * p.unitCost)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Parts & Inventory"
        description="Track spare parts stock levels, suppliers, and reorder requirements."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Parts' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>New Requisition</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total SKUs</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Low Stock</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.low}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Critical / Out of Stock</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.critical}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Inventory Value</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(summary.value, { compact: true })}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search part, SKU, supplier..." className="sm:max-w-xs" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))} placeholder="All Categories" className="sm:w-48" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        {(search || category || status) && <button onClick={() => { setSearch(''); setCategory(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(p) => p.id} pageSize={10} />
      </Card>
    </div>
  );
}

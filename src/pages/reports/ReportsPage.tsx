import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileBarChart, Printer, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { reportCategories, type ReportDef } from '@/data/reports';
import { rrrApi, type Rrr } from '@/pages/rrr/rrrApi';
import { formatDate } from '@/lib/utils';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';

export function ReportsPage() {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ReportDef | null>(null);
  const [rrrs, setRrrs] = useState<Rrr[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!active) return;
    setLoadingPreview(true);
    rrrApi.list({ limit: 50 }).then((res) => setRrrs(res.items)).finally(() => setLoadingPreview(false));
  }, [active]);

  const filteredCategories = reportCategories
    .map((cat) => ({ ...cat, reports: cat.reports.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())) }))
    .filter((cat) => cat.reports.length > 0);

  const columns: Column<Rrr>[] = [
    { key: 'ref', header: 'RRR #', render: (r) => <span className="font-semibold text-brand-800">{r.ref}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'route', header: 'Route', render: (r) => `${r.pickup} → ${r.destination}` },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt, 'short') },
    { key: 'priority', header: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Reports Center"
        description="Browse operational, fleet, maintenance, and finance report types."
        breadcrumbs={[{ label: 'Analytics' }, { label: 'Reports' }]}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search reports..." className="mb-6 max-w-sm" />

      <div className="flex flex-col gap-8">
        {filteredCategories.map((cat) => (
          <div key={cat.id}>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              <h2 className="font-display text-[15px] font-semibold text-brand-950">{cat.name}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.reports.map((r, i) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  onClick={() => setActive(r)}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100"><FileBarChart size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-brand-950">{r.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.description}</p>
                  </div>
                  <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-slate-400">
            <Search size={28} className="mb-3" />
            No reports match "{search}"
          </div>
        )}
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width="lg"
        title={active?.name}
        subtitle={active?.description}
        footer={<Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>}
      >
        {active && (
          <div>
            <p className="mb-4 text-xs text-slate-400">This preview uses live RRR data as a representative sample — full per-report filtering (date range, branch) is not built yet for every report type in this catalog.</p>
            <Card>
              <CardHeader title="RRR Preview" subtitle={`${rrrs.length} most recent records`} />
              <DataTable columns={columns} data={rrrs} keyField={(r) => r.id} loading={loadingPreview} pageSize={rrrs.length || 6} />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}

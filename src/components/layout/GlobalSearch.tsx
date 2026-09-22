import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ClipboardList, Briefcase, Route, Truck, UserRound, FileText, Wrench, PackageSearch, Building2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth';
import { opsApi } from '@/lib/opsApi';
import { rrrApi } from '@/pages/rrr/rrrApi';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  icon: typeof Search;
  to: string;
}

/**
 * Real, live search across the actual database — queried on every keystroke
 * (debounced) rather than built once from a static in-memory index. Each
 * section is skipped if the signed-in user lacks the matching view permission.
 */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { can } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      const tasks: Promise<SearchResult[]>[] = [];

      if (can('rrr:view')) tasks.push(rrrApi.list({ q, limit: 6 }, ctrl.signal).then((r) => r.items.map((x) => ({ id: x.id, title: x.ref, subtitle: `${x.pickup} → ${x.destination} — ${x.status}`, group: 'RRR', icon: ClipboardList, to: `/app/rrr/${x.id}` }))).catch(() => []));
      if (can('jobs:view')) tasks.push(opsApi.jobs.list({ q, limit: 6 }, ctrl.signal).then((r) => r.items.map((x) => ({ id: x.id, title: x.ref, subtitle: `${x.pickup} → ${x.destination} — ${x.status}`, group: 'Jobs', icon: Briefcase, to: '/app/jobs' }))).catch(() => []));
      if (can('trips:view')) tasks.push(opsApi.trips.list({ q, limit: 6 }, ctrl.signal).then((r) => r.items.map((x) => ({ id: x.id, title: x.ref, subtitle: `${x.route} — ${x.status}`, group: 'Trips', icon: Route, to: `/app/trips/${x.id}` }))).catch(() => []));
      if (can('fleet:view')) {
        tasks.push(opsApi.vehicles.list({ q, limit: 6 }, ctrl.signal).then((r) => r.items.map((x) => ({ id: x.id, title: `${x.unitNumber} — ${x.registration}`, subtitle: `${x.type} — ${x.status}`, group: 'Vehicles', icon: Truck, to: `/app/fleet/vehicles/${x.id}` }))).catch(() => []));
        tasks.push(opsApi.drivers.list({ q, limit: 6 }, ctrl.signal).then((r) => r.items.map((x) => ({ id: x.id, title: x.name, subtitle: `${x.licenseNumber} — ${x.status}`, group: 'Drivers', icon: UserRound, to: `/app/fleet/drivers/${x.id}` }))).catch(() => []));
      }
      if (can('rrr:view')) {
        tasks.push(rrrApi.customers(ctrl.signal).then((r) => r.items
          .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.city ?? '').toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6)
          .map((c) => ({ id: c.id, title: c.name, subtitle: [c.city, c.industry].filter(Boolean).join(' — '), group: 'Customers', icon: Building2, to: '/app/rrr' }))).catch(() => []));
      }
      if (can('finance:view')) {
        tasks.push(opsApi.invoices.list({ limit: 200 }, ctrl.signal).then((r) => r.items
          .filter((i) => i.ref.toLowerCase().includes(q.toLowerCase()) || i.customerName.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6)
          .map((i) => ({ id: i.id, title: i.ref, subtitle: `${i.status} — ${i.customerName}`, group: 'Invoices', icon: FileText, to: '/app/finance/invoices' }))).catch(() => []));
      }
      if (can('maintenance:view')) {
        tasks.push(opsApi.workshops.list(ctrl.signal).then((r) => r.items
          .filter((w) => w.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6)
          .map((w) => ({ id: w.id, title: w.name, subtitle: [w.city, w.type].filter(Boolean).join(' — '), group: 'Workshops', icon: Wrench, to: '/app/maintenance/workshops' }))).catch(() => []));
        tasks.push(opsApi.parts.list(ctrl.signal).then((r) => r.items
          .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6)
          .map((p) => ({ id: p.id, title: p.name, subtitle: `${p.sku} — ${p.status}`, group: 'Parts', icon: PackageSearch, to: '/app/maintenance/parts' }))).catch(() => []));
      }

      Promise.all(tasks).then((groups) => setResults(groups.flat())).finally(() => setLoading(false));
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  function go(to: string) {
    navigate(to);
    onClose();
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-modal"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
              <Search size={17} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search RRR, jobs, trips, vehicles, drivers, invoices..."
                className="flex-1 bg-transparent text-sm text-brand-950 placeholder:text-slate-400 focus:outline-none"
              />
              <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {!query.trim() && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">Start typing to search across the entire platform</p>
              )}
              {query.trim() && !loading && grouped.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">No results for "{query}"</p>
              )}
              {grouped.map(([group, items]) => (
                <div key={group} className="mb-2">
                  <p className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
                  {items.map((r) => (
                    <button
                      key={r.group + r.id}
                      onClick={() => go(r.to)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-brand-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <r.icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-brand-950">{r.title}</span>
                        <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

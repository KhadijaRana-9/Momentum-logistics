import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ClipboardList, Briefcase, Route, Truck, UserRound, FileText, Wrench, PackageSearch, Building2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { rrrs } from '@/data/rrr';
import { jobs } from '@/data/jobs';
import { trips } from '@/data/trips';
import { vehicles } from '@/data/vehicles';
import { drivers } from '@/data/drivers';
import { customers } from '@/data/customers';
import { invoices } from '@/data/invoices';
import { workshops } from '@/data/workshops';
import { parts } from '@/data/parts';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  icon: typeof Search;
  to: string;
}

function buildIndex(): SearchResult[] {
  return [
    ...rrrs.map((r) => ({ id: r.id, title: r.id, subtitle: `${r.route} — ${r.status}`, group: 'RRR', icon: ClipboardList, to: `/rrr/${r.id}` })),
    ...jobs.map((j) => ({ id: j.id, title: j.id, subtitle: `${j.route} — ${j.status}`, group: 'Jobs', icon: Briefcase, to: `/jobs` })),
    ...trips.map((t) => ({ id: t.id, title: t.id, subtitle: `${t.route} — ${t.status}`, group: 'Trips', icon: Route, to: `/trips/${t.id}` })),
    ...vehicles.map((v) => ({ id: v.id, title: `${v.unitNumber} — ${v.registration}`, subtitle: `${v.type} — ${v.status}`, group: 'Vehicles', icon: Truck, to: `/fleet/vehicles/${v.id}` })),
    ...drivers.map((d) => ({ id: d.id, title: d.name, subtitle: `${d.licenseNumber} — ${d.status}`, group: 'Drivers', icon: UserRound, to: `/fleet/drivers/${d.id}` })),
    ...customers.map((c) => ({ id: c.id, title: c.name, subtitle: `${c.city} — ${c.industry}`, group: 'Customers', icon: Building2, to: `/rrr` })),
    ...invoices.map((i) => ({ id: i.id, title: i.id, subtitle: `${i.status} — Due ${i.dueDate}`, group: 'Invoices', icon: FileText, to: `/finance/invoices` })),
    ...workshops.map((w) => ({ id: w.id, title: w.name, subtitle: `${w.city} — ${w.type}`, group: 'Workshops', icon: Wrench, to: `/maintenance/workshops` })),
    ...parts.map((p) => ({ id: p.id, title: p.name, subtitle: `${p.sku} — ${p.status}`, group: 'Parts', icon: PackageSearch, to: `/maintenance/parts` })),
  ];
}

const INDEX = buildIndex();

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return INDEX.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)).slice(0, 24);
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
              {query.trim() && grouped.length === 0 && (
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

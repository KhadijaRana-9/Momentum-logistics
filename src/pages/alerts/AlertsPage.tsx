import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { alerts as alertData } from '@/data/alerts';
import { cn, timeAgo } from '@/lib/utils';

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const MODULE_OPTIONS = Array.from(new Set(alertData.map((a) => a.module)));

export function AlertsPage() {
  const [alerts, setAlerts] = useState(alertData);
  const [severity, setSeverity] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const filtered = useMemo(() => alerts.filter((a) => {
    if (severity && a.severity !== severity) return false;
    if (moduleFilter && a.module !== moduleFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [alerts, severity, moduleFilter]);

  const counts = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === 'Critical' && !a.read).length,
    high: alerts.filter((a) => a.severity === 'High' && !a.read).length,
    unread: alerts.filter((a) => !a.read).length,
  }), [alerts]);

  function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }
  function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  return (
    <div>
      <PageHeader
        title="Alerts Center"
        description="System-wide exceptions and notifications requiring attention."
        breadcrumbs={[{ label: 'Analytics' }, { label: 'Alerts' }]}
        actions={<Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead}>Mark all as read</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Unread</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{counts.unread}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Critical</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{counts.critical}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">High</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{counts.high}</p></Card>
      </div>

      <Toolbar>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} options={SEVERITY_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Severities" className="sm:w-44" />
        <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} options={MODULE_OPTIONS.map((m) => ({ label: m, value: m }))} placeholder="All Modules" className="sm:w-44" />
        {(severity || moduleFilter) && <button onClick={() => { setSeverity(''); setModuleFilter(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No alerts" description="Nothing matches the selected filters." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
                className={cn('flex items-start gap-3.5 px-5 py-3.5', !a.read && 'bg-brand-50/30')}
              >
                <span className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  a.severity === 'Critical' && 'bg-rose-50 text-rose-600',
                  a.severity === 'High' && 'bg-amber-50 text-amber-600',
                  a.severity === 'Medium' && 'bg-sky-50 text-sky-600',
                  a.severity === 'Low' && 'bg-slate-100 text-slate-500',
                )}>
                  <AlertTriangle size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-brand-950">{a.title}</p>
                    <StatusBadge status={a.severity} dot={false} />
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-500">{a.module}</span>
                    {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                  </div>
                  <p className="mt-1 text-[13px] text-slate-500">{a.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{a.entity} · {timeAgo(a.timestamp)}</p>
                </div>
                {!a.read && (
                  <button onClick={() => markRead(a.id)} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50">
                    <Check size={13} /> Mark read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

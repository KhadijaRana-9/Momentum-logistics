import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from './crmApi';
import type { Followup } from './types';

const SCOPES = [
  { id: 'today', label: 'Today & overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

export function FollowupsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const [scope, setScope] = useState('today');
  const [mineOnly, setMineOnly] = useState(true);
  const [items, setItems] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      crmApi
        .listFollowups({ scope, assignedTo: mineOnly ? 'me' : undefined, limit: 100 }, signal)
        .then((r) => setItems(r.items))
        .catch((err: Error) => {
          if (err.name !== 'AbortError') toast({ type: 'error', title: 'Failed to load follow-ups' });
        })
        .finally(() => setLoading(false));
    },
    [scope, mineOnly, toast],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  async function complete(f: Followup) {
    try {
      await crmApi.updateFollowup(f.id, { status: 'Completed' });
      load();
      toast({ type: 'success', title: 'Marked complete' });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Stay on top of every scheduled touchpoint across the pipeline."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Follow-ups' }]}
        actions={
          <label className="flex items-center gap-2 text-[13px] text-slate-600">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="rounded border-slate-300" />
            Only mine
          </label>
        }
      />

      <Tabs className="mb-4" tabs={SCOPES} value={scope} onChange={setScope} />

      <Card>
        {loading ? (
          <div className="p-5"><TableSkeleton columns={4} /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Nothing here" description="No follow-ups match this view." />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((f) => (
              <div key={f.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/app/crm/leads/${f.leadId}`} className="font-medium text-brand-900 hover:underline">{f.leadRef}</Link>
                    <StatusBadge status={f.overdue && f.status === 'Pending' ? 'Overdue' : f.status} dot={false} />
                    <span className="text-[12px] text-slate-400">{f.type} · {f.priority}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-slate-500">
                    <Clock size={12} /> {formatDateTime(f.dueAt)} · {f.assignedToName}
                  </p>
                  {f.notes && <p className="mt-0.5 text-[12.5px] text-slate-600">{f.notes}</p>}
                </div>
                {f.status === 'Pending' && can('followups:manage') && (
                  <button
                    onClick={() => complete(f)}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Check size={13} /> Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

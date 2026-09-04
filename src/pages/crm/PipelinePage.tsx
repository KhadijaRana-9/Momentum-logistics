import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { crmApi } from './crmApi';
import { LeadTemperatureBadge } from './components/LeadBits';
import { LEAD_STATUSES, type Lead } from './types';

const OPEN_STAGES = LEAD_STATUSES.filter((s) => s !== 'Won' && s !== 'Lost');

export function PipelinePage() {
  const [byStage, setByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const results = await Promise.all(
          OPEN_STAGES.map((stage) => crmApi.listLeads({ status: stage, limit: 25, sort: 'score', dir: 'desc' }, ctrl.signal)),
        );
        const map: Record<string, Lead[]> = {};
        OPEN_STAGES.forEach((stage, i) => { map[stage] = results[i].items; });
        setByStage(map);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setByStage({});
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  return (
    <div>
      <PageHeader
        title="Sales Pipeline"
        description="Open opportunities by stage, highest-scoring first."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Pipeline' }]}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {OPEN_STAGES.map((stage) => (
            <div key={stage} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[13px] font-semibold text-brand-950">{stage}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{byStage[stage]?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(byStage[stage] ?? []).map((lead) => (
                  <Link key={lead.id} to={`/app/crm/leads/${lead.id}`}>
                    <Card className="p-3 transition-shadow hover:shadow-card-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-brand-900">{lead.name}</span>
                        <LeadTemperatureBadge temperature={lead.temperature} />
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500">{lead.company ?? lead.email ?? '—'}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{lead.productInterest}</span>
                        <span>{lead.assignedToName ?? 'Unassigned'}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
                {(byStage[stage] ?? []).length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[12px] text-slate-400">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

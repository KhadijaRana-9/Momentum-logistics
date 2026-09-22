import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import { opsApi, type Job } from '@/lib/opsApi';
import { JobListView } from './JobListView';
import { JobBoardView } from './JobBoardView';

export function JobsPage() {
  const [view, setView] = useState<'list' | 'board'>('board');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    opsApi.jobs
      .list({ limit: 200 }, ctrl.signal)
      .then((res) => { setJobs(res.items); setError(null); })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load jobs'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const summary = useMemo(() => ({
    total: jobs.length,
    unassigned: jobs.filter((j) => !j.vehicleId).length,
    active: jobs.filter((j) => ['Dispatched', 'In Progress'].includes(j.status)).length,
    revenue: jobs.reduce((s, j) => s + j.revenue, 0),
  }), [jobs]);

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Track job execution from assignment through delivery and invoicing."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Jobs' }]}
        actions={<Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/app/rrr')}>New Job from RRR</Button>}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Jobs</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{summary.total}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Unassigned</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.unassigned}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Value</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">AED {(summary.revenue / 1000).toFixed(0)}K</p></Card>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Tabs
          tabs={[{ id: 'board', label: 'Job Board' }, { id: 'list', label: 'Job List' }]}
          value={view}
          onChange={(v) => setView(v as 'list' | 'board')}
        />
        <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-0.5 sm:flex">
          <button onClick={() => setView('board')} className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === 'board' ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-400'}`}><LayoutGrid size={14} /></button>
          <button onClick={() => setView('list')} className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === 'list' ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-400'}`}><ListIcon size={14} /></button>
        </div>
      </div>

      {view === 'list' ? <JobListView jobs={jobs} loading={loading} /> : <JobBoardView jobs={jobs} />}
    </div>
  );
}

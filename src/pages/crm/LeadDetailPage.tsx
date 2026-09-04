import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Globe, Clock, Send, CalendarPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/Badge';
import { Timeline, type TimelineEvent } from '@/components/ui/Timeline';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from './crmApi';
import { LeadTemperatureBadge } from './components/LeadBits';
import { ScheduleFollowupModal } from './components/ScheduleFollowupModal';
import { LEAD_STATUSES, type Activity, type Followup, type Lead, type Submission, type TeamMember } from './types';

const ACTIVITY_TONE: Record<string, TimelineEvent['tone']> = {
  lead_created: 'brand',
  form_submitted: 'brand',
  status_changed: 'warning',
  lead_won: 'success',
  lead_lost: 'danger',
  note_added: 'neutral',
  lead_assigned: 'brand',
  followup_created: 'warning',
  followup_completed: 'success',
  email_sent: 'neutral',
  score_recalculated: 'neutral',
};

export function LeadDetailPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const { can } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await crmApi.getLead(id, signal);
        setLead(res.lead);
        setActivities(res.activities);
        setFollowups(res.followups);
        setSubmissions(res.submissions);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    if (can('leads:assign')) crmApi.team(ctrl.signal).then((r) => setTeam(r.items)).catch(() => {});
    return () => ctrl.abort();
  }, [load, can]);

  async function changeStatus(status: string) {
    if (!lead || status === lead.status) return;
    let reason: string | undefined;
    if (status === 'Lost') {
      reason = window.prompt('Reason for marking this lead Lost?') ?? undefined;
      if (!reason) return;
    }
    setBusy(true);
    try {
      const res = await crmApi.setStatus(lead.id, status, reason);
      setLead(res.lead);
      await load();
      toast({ type: 'success', title: `Status set to ${status}` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not change status', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function assign(userId: string) {
    if (!lead) return;
    setBusy(true);
    try {
      const res = await crmApi.assignLead(lead.id, userId || null);
      setLead(res.lead);
      await load();
      toast({ type: 'success', title: userId ? 'Lead assigned' : 'Lead unassigned' });
    } catch (err) {
      toast({ type: 'error', title: 'Could not assign', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!lead || !note.trim()) return;
    setBusy(true);
    try {
      await crmApi.addNote(lead.id, note.trim());
      setNote('');
      await load();
      toast({ type: 'success', title: 'Note added' });
    } catch (err) {
      toast({ type: 'error', title: 'Could not add note', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function completeFollowup(f: Followup) {
    setBusy(true);
    try {
      await crmApi.updateFollowup(f.id, { status: 'Completed' });
      await load();
      toast({ type: 'success', title: 'Follow-up completed' });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="space-y-5"><CardSkeleton /><CardSkeleton /></div>;
  if (error || !lead) {
    return <EmptyState variant="error" title="Lead unavailable" description={error ?? 'This lead could not be found.'} action={<Link to="/app/crm/leads" className="text-sm font-medium text-brand-700">Back to leads</Link>} />;
  }

  const timeline: TimelineEvent[] = activities.map((a) => ({
    title: a.title,
    description: a.detail ?? (a.actorName !== 'System' ? `by ${a.actorName}` : undefined),
    timestamp: a.createdAt,
    tone: ACTIVITY_TONE[a.type] ?? 'neutral',
  }));

  return (
    <div>
      <PageHeader
        title={lead.name}
        breadcrumbs={[{ label: 'CRM' }, { label: 'Leads', to: '/app/crm/leads' }, { label: lead.ref }]}
        actions={
          <Link to="/app/crm/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
            <ArrowLeft size={15} /> All leads
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <LeadTemperatureBadge temperature={lead.temperature} score={lead.score} />
              <StatusBadge status={lead.status} />
              <span className="text-xs text-slate-400">{lead.ref}</span>
              <span className="ml-auto text-xs text-slate-400">Created {formatDate(lead.createdAt)}</span>
            </div>

            <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
              <Detail icon={Mail} label="Email" value={lead.email} />
              <Detail icon={Phone} label="Phone" value={lead.phone} />
              <Detail icon={Building2} label="Company" value={lead.company} />
              <Detail icon={Globe} label="Industry" value={lead.industry} />
              <Detail label="Product" value={lead.productInterest} />
              <Detail label="Service" value={lead.serviceType} />
              <Detail label="Budget" value={lead.budget} />
              <Detail label="Timeline" value={lead.timeline} />
              <Detail label="Company size" value={lead.companySize} />
              <Detail label="Business email" value={lead.isBusinessEmail ? 'Yes' : 'No'} />
            </dl>

            {lead.requirements && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[13px] whitespace-pre-wrap text-slate-700">{lead.requirements}</div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attribution</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
                <Chip>Source: {lead.attribution.source}</Chip>
                {lead.attribution.campaign && <Chip>Campaign: {lead.attribution.campaign}</Chip>}
                {lead.attribution.firstTouchSource && <Chip>First touch: {lead.attribution.firstTouchSource}</Chip>}
                {lead.attribution.landingPage && <Chip>Landing: {lead.attribution.landingPage}</Chip>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h3 className="font-display text-[15px] font-semibold text-brand-950">Activity timeline</h3>
            </div>
            <div className="p-5">
              {timeline.length === 0 ? <p className="text-[13px] text-slate-400">No activity yet.</p> : <Timeline events={timeline} />}
            </div>
          </Card>

          {submissions.length > 0 && (
            <Card>
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h3 className="font-display text-[15px] font-semibold text-brand-950">Form submissions ({submissions.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <div key={s.id} className="px-5 py-3 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-brand-900">{s.type.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400">{formatDateTime(s.createdAt)}</span>
                    </div>
                    <pre className="mt-1.5 overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                      {JSON.stringify(pruneObject(s.payload), null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {can('leads:edit') && (
            <Card className="p-5">
              <h3 className="font-display text-[14px] font-semibold text-brand-950">Pipeline stage</h3>
              <Select
                className="mt-2"
                value={lead.status}
                disabled={busy}
                onChange={(e) => changeStatus(e.target.value)}
                options={LEAD_STATUSES.map((s) => ({ label: s, value: s }))}
              />
            </Card>
          )}

          {can('leads:assign') && (
            <Card className="p-5">
              <h3 className="font-display text-[14px] font-semibold text-brand-950">Owner</h3>
              <Select
                className="mt-2"
                value={lead.assignedTo ?? ''}
                disabled={busy}
                onChange={(e) => assign(e.target.value)}
                placeholder="Unassigned"
                options={team.map((m) => ({ label: `${m.name} (${m.role})`, value: m.id }))}
              />
              {!can('leads:assign') && lead.assignedToName && <p className="mt-2 text-[13px] text-slate-600">{lead.assignedToName}</p>}
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[14px] font-semibold text-brand-950">Follow-ups</h3>
              {can('followups:manage') && (
                <Button size="xs" variant="secondary" icon={CalendarPlus} onClick={() => setShowFollowup(true)}>Schedule</Button>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {followups.length === 0 && <p className="text-[13px] text-slate-400">None scheduled.</p>}
              {followups.map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-200 p-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-900">{f.type}</span>
                    <StatusBadge status={f.overdue && f.status === 'Pending' ? 'Overdue' : f.status} dot={false} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-slate-500"><Clock size={11} /> {formatDateTime(f.dueAt)} · {f.assignedToName}</p>
                  {f.notes && <p className="mt-1 text-slate-600">{f.notes}</p>}
                  {f.status === 'Pending' && can('followups:manage') && (
                    <button onClick={() => completeFollowup(f)} className="mt-1.5 text-[12px] font-medium text-brand-700 hover:underline">Mark complete</button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {can('leads:edit') && (
            <Card className="p-5">
              <h3 className="font-display text-[14px] font-semibold text-brand-950">Add a note</h3>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" placeholder="Log a call, an email, context…" />
              <Button size="sm" className="mt-2" icon={Send} loading={busy} disabled={!note.trim()} onClick={addNote}>Save note</Button>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-display text-[14px] font-semibold text-brand-950">Score breakdown</h3>
            <p className="mt-1 text-[12px] text-slate-400">Deterministic — {lead.score}/100 ({lead.temperature})</p>
            <ul className="mt-2 space-y-1">
              {lead.scoreFactors.length === 0 && <li className="text-[13px] text-slate-400">No scoring signals yet.</li>}
              {lead.scoreFactors.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-600">{f.label}</span>
                  <span className="font-semibold text-emerald-600">+{f.points}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <ScheduleFollowupModal
        open={showFollowup}
        onClose={() => setShowFollowup(false)}
        leadId={lead.id}
        team={team}
        onScheduled={() => load()}
      />
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value?: string | null }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {Icon && <Icon size={11} />} {label}
      </dt>
      <dd className="mt-0.5 text-slate-800">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">{children}</span>;
}

function pruneObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v == null) continue;
    if (['website_url', 'gclid', 'fbclid'].includes(k)) continue;
    out[k] = v;
  }
  return out;
}

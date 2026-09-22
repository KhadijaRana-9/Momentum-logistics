import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Calendar, CheckCircle2, ClipboardList, FileText, MapPin, Package,
  Send, Truck, UserRound, XCircle, Briefcase,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { WorkflowStepper } from '@/components/ui/WorkflowStepper';
import { Timeline } from '@/components/ui/Timeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { rrrApi, type Rrr, type RrrCustomer } from './rrrApi';
import { crmApi } from '@/pages/crm/crmApi';
import type { AuditLogEntry } from '@/pages/crm/types';
import { opsApi } from '@/lib/opsApi';
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel';

const PIPELINE_STAGES = ['Draft', 'Submitted', 'Approved', 'Assigned', 'Job Created', 'Dispatched', 'Completed'];

export function RrrDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [tab, setTab] = useState('overview');
  const [rrr, setRrr] = useState<Rrr | null>(null);
  const [customer, setCustomer] = useState<RrrCustomer | null>(null);
  const [activity, setActivity] = useState<AuditLogEntry[] | 'forbidden' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [rrrRes, customersRes] = await Promise.all([rrrApi.get(id, signal), rrrApi.customers(signal)]);
        setRrr(rrrRes.rrr);
        setCustomer(customersRes.items.find((c) => c.id === rrrRes.rrr.customerId) ?? null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load RRR');
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => {
    if (!rrr) return;
    const ctrl = new AbortController();
    crmApi
      .auditLog(ctrl.signal)
      .then((res) => setActivity(res.items.filter((a) => a.entity === 'rrr' && a.entityId === rrr.ref)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setActivity('forbidden');
      });
    return () => ctrl.abort();
  }, [rrr]);

  async function setStatus(status: Rrr['status'], reason?: string) {
    if (!rrr) return;
    setBusy(true);
    try {
      const res = await rrrApi.setStatus(rrr.id, status, reason);
      setRrr(res.rrr);
      toast({ type: 'success', title: `RRR ${status}`, description: `${res.rrr.ref} moved to ${status}` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update status', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function createJob() {
    if (!rrr) return;
    setBusy(true);
    try {
      const job = await opsApi.jobs.createFromRrr(rrr.id);
      toast({ type: 'success', title: 'Job created', description: `${job.ref} — assign a vehicle & driver in Dispatch Center` });
      await load();
      navigate('/app/dispatch');
    } catch (err) {
      toast({ type: 'error', title: 'Could not create job', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CardSkeleton />;
  if (error || !rrr) {
    return (
      <div>
        <PageHeader title="RRR Not Found" breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }]} />
        <Card><EmptyState title="RRR not found" description={error ?? 'This requisition may have been removed.'} /></Card>
      </div>
    );
  }

  const rejected = rrr.status === 'Rejected';

  return (
    <div>
      <PageHeader
        title={rrr.ref}
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }, { label: rrr.ref }]}
        description={`Requested by ${rrr.requestedByName} on ${formatDate(rrr.createdAt)}`}
        actions={
          <>
            {rrr.status === 'Draft' && can('rrr:edit') && (
              <Button variant="primary" size="sm" icon={Send} loading={busy} onClick={() => setStatus('Submitted')}>Submit for Approval</Button>
            )}
            {rrr.status === 'Submitted' && can('rrr:approve') && (
              <>
                <Button variant="danger" size="sm" icon={XCircle} loading={busy} onClick={() => {
                  const reason = window.prompt('Reason for rejecting this RRR?');
                  if (reason) void setStatus('Rejected', reason);
                }}>Reject</Button>
                <Button variant="primary" size="sm" icon={CheckCircle2} loading={busy} onClick={() => setStatus('Approved')}>Approve</Button>
              </>
            )}
            {rrr.status === 'Approved' && !rrr.jobRef && can('jobs:manage') && (
              <Button variant="primary" size="sm" icon={Briefcase} loading={busy} onClick={createJob}>Create Job</Button>
            )}
          </>
        }
      />

      {rrr.status === 'Rejected' && rrr.rejectionReason && (
        <Card className="mb-5 border-rose-200 bg-rose-50 px-5 py-3.5 text-[13px] text-rose-700">
          <strong>Rejected:</strong> {rrr.rejectionReason}
        </Card>
      )}

      <Card className="mb-5 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requisition Workflow</span>
          <StatusBadge status={rrr.status} />
        </div>
        <WorkflowStepper stages={PIPELINE_STAGES} current={rejected ? 'Submitted' : rrr.status} rejected={rejected} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              className="px-5 pt-3"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'attachments', label: 'Attachments' },
                { id: 'activity', label: 'Activity' },
              ]}
            />
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="divide-y divide-slate-100">
                <SectionBlock icon={MapPin} title="Route & Schedule">
                  <InfoGrid>
                    <Info label="Pickup Location" value={rrr.pickup} />
                    <Info label="Destination" value={rrr.destination} />
                    <Info label="Route" value={rrr.route} />
                    <Info label="Required Date" value={formatDate(rrr.requiredDate, 'long')} />
                  </InfoGrid>
                </SectionBlock>
                <SectionBlock icon={Package} title="Loading & Unloading">
                  <InfoGrid>
                    <Info label="Loading Information" value={rrr.loadingInfo} span />
                    <Info label="Unloading Information" value={rrr.unloadingInfo} span />
                  </InfoGrid>
                </SectionBlock>
                <SectionBlock icon={Truck} title="Vehicle & Driver Requirement">
                  <InfoGrid>
                    <Info label="Vehicle Type" value={rrr.vehicleType} />
                    <Info label="Driver Required" value={rrr.driverRequired ? 'Yes' : 'No'} />
                    <Info label="Assigned Vehicle" value={rrr.assignedVehicleRef ?? (rrr.jobRef ? 'See the linked Job in Dispatch Center' : 'Assigned once a Job is created and dispatched')} />
                    <Info label="Assigned Driver" value={rrr.assignedDriverRef ?? (rrr.jobRef ? 'See the linked Job in Dispatch Center' : 'Assigned once a Job is created and dispatched')} />
                  </InfoGrid>
                </SectionBlock>
                <SectionBlock icon={ClipboardList} title="Additional Information">
                  <InfoGrid>
                    <Info label="Department" value={rrr.department} />
                    <Info label="Contract Reference" value={rrr.contractRef} />
                    <Info label="Priority" value={<PriorityBadge priority={rrr.priority} />} />
                    <Info label="Special Instructions" value={rrr.specialInstructions} span />
                  </InfoGrid>
                </SectionBlock>
              </motion.div>
            )}
            {tab === 'attachments' && (
              <div className="p-5">
                <AttachmentsPanel parentType="rrr" parentId={rrr.id} canUpload={can('rrr:edit')} />
              </div>
            )}
            {tab === 'activity' && (
              <div className="p-5">
                {activity === 'forbidden' ? (
                  <p className="text-[13px] text-slate-400">You don't have permission to view the audit history.</p>
                ) : !activity ? (
                  <p className="text-[13px] text-slate-400">Loading…</p>
                ) : activity.length === 0 ? (
                  <p className="text-[13px] text-slate-400">No recorded activity yet.</p>
                ) : (
                  <Timeline
                    events={activity.map((a) => ({
                      title: `${a.actorName} — ${a.action.replace('rrr.', '').replace(/_/g, ' ')}`,
                      description: a.changes.length ? a.changes.map((c) => `${c.field}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`).join(', ') : undefined,
                      timestamp: a.createdAt,
                      icon: a.action.includes('approved') ? CheckCircle2 : a.action.includes('rejected') ? XCircle : FileText,
                      tone: a.action.includes('approved') ? 'success' : a.action.includes('rejected') ? 'danger' : 'neutral',
                    }))}
                  />
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Customer" />
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Building2 size={18} /></span>
                <div>
                  <p className="text-[13px] font-semibold text-brand-950">{rrr.customerName}</p>
                  {customer?.industry && <p className="text-xs text-slate-400">{customer.industry}</p>}
                </div>
              </div>
              {customer?.city && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={13} /> {customer.city}</div>}
              {customer?.contactName && <div className="flex items-center gap-2 text-xs text-slate-500"><UserRound size={13} /> {customer.contactName}</div>}
              {customer?.contractType && <Badge tone={customer.contractType === 'Contract' ? 'brand' : 'neutral'} className="mt-1 w-fit">{customer.contractType}</Badge>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Related Job" />
            <CardBody>
              {rrr.jobRef ? (
                <button onClick={() => navigate('/app/jobs')} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Briefcase size={16} /></span>
                  <p className="flex-1 text-[13px] font-semibold text-brand-950">{rrr.jobRef}</p>
                </button>
              ) : rrr.status === 'Approved' ? (
                <p className="text-xs text-slate-400">No job created yet — use "Create Job" above.</p>
              ) : (
                <p className="text-xs text-slate-400">A job can be created once this RRR is Approved.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Key Dates" />
            <CardBody className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Requested</span>
                <span className="font-medium text-brand-950">{formatDateTime(rrr.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Required by</span>
                <span className="font-medium text-brand-950">{formatDate(rrr.requiredDate, 'short')}</span>
              </div>
              {rrr.approvedByName && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-slate-500"><CheckCircle2 size={13} /> Approved by</span>
                  <span className="font-medium text-brand-950">{rrr.approvedByName}</span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className="text-brand-700" />
        <h3 className="text-[13px] font-semibold text-brand-950">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</div>;
}

function Info({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 text-[13.5px] text-slate-700">{value || <span className="text-slate-300">—</span>}</div>
    </div>
  );
}

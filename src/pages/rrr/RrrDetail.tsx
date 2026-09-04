import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Calendar, CheckCircle2, ClipboardList, FileText, MapPin, Package,
  Paperclip, Pencil, Phone, Printer, Truck, UserRound, XCircle, Briefcase,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { WorkflowStepper } from '@/components/ui/WorkflowStepper';
import { Timeline } from '@/components/ui/Timeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRrr, RRR_PIPELINE_STAGES } from '@/data/rrr';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import { getJob } from '@/data/jobs';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export function RrrDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const rrr = getRrr(id ?? '');

  if (!rrr) {
    return (
      <div>
        <PageHeader title="RRR Not Found" breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }]} />
        <Card><EmptyState title="RRR not found" description="This requisition may have been removed." /></Card>
      </div>
    );
  }

  const customer = getCustomer(rrr.customerId);
  const vehicle = getVehicle(rrr.assignedVehicleId);
  const driver = getDriver(rrr.assignedDriverId);
  const job = rrr.jobId ? getJob(rrr.jobId) : undefined;
  const rejected = rrr.status === 'Rejected';

  return (
    <div>
      <PageHeader
        title={rrr.id}
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }, { label: rrr.id }]}
        description={`Requested by ${rrr.requestedBy} on ${formatDate(rrr.date)}`}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Printer}>Print</Button>
            <Button variant="secondary" size="sm" icon={Pencil}>Edit</Button>
            {rrr.status === 'Submitted' && (
              <>
                <Button variant="danger" size="sm" icon={XCircle} onClick={() => toast({ type: 'error', title: 'RRR Rejected', description: `${rrr.id} has been rejected` })}>Reject</Button>
                <Button variant="primary" size="sm" icon={CheckCircle2} onClick={() => toast({ type: 'success', title: 'RRR Approved', description: `${rrr.id} moved to Approved` })}>Approve</Button>
              </>
            )}
          </>
        }
      />

      <Card className="mb-5 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requisition Workflow</span>
          <StatusBadge status={rrr.status} />
        </div>
        <WorkflowStepper stages={RRR_PIPELINE_STAGES} current={rejected ? 'Submitted' : rrr.status} rejected={rejected} />
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
                { id: 'documents', label: 'Documents', count: 2 },
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
                    <Info label="Assigned Vehicle" value={vehicle ? `${vehicle.unitNumber} — ${vehicle.registration}` : 'Not yet assigned'} />
                    <Info label="Assigned Driver" value={driver ? driver.name : 'Not yet assigned'} />
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
            {tab === 'documents' && (
              <div className="p-5">
                <div className="flex flex-col gap-2">
                  {['Customer PO — Signed.pdf', 'Loading Instructions.pdf'].map((doc) => (
                    <div key={doc} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Paperclip size={15} /></span>
                      <span className="flex-1 text-[13px] font-medium text-slate-700">{doc}</span>
                      <Button variant="ghost" size="xs">View</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'activity' && (
              <div className="p-5">
                <Timeline
                  events={[
                    { title: `${rrr.requestedBy} created this RRR`, timestamp: rrr.date, icon: FileText, tone: 'neutral' },
                    ...(rrr.approvedBy ? [{ title: `${rrr.approvedBy} approved the request`, timestamp: rrr.date, icon: CheckCircle2, tone: 'success' as const }] : []),
                    ...(rrr.assignedVehicleId ? [{ title: 'Vehicle & driver assigned', description: `${vehicle?.unitNumber} / ${driver?.name}`, timestamp: rrr.date, icon: Truck, tone: 'brand' as const }] : []),
                    ...(job ? [{ title: `Job ${job.id} created`, timestamp: job.scheduledDate, icon: Briefcase, tone: 'brand' as const }] : []),
                  ]}
                />
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
                  <p className="text-[13px] font-semibold text-brand-950">{customer?.name}</p>
                  <p className="text-xs text-slate-400">{customer?.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={13} /> {customer?.city}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={13} /> {customer?.contactPhone}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><UserRound size={13} /> {customer?.contactName}</div>
              <Badge tone={customer?.contractType === 'Contract' ? 'brand' : 'neutral'} className="mt-1 w-fit">{customer?.contractType}</Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Related Job" />
            <CardBody>
              {job ? (
                <button onClick={() => navigate('/app/jobs')} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Briefcase size={16} /></span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-brand-950">{job.id}</p>
                    <p className="text-xs text-slate-400">{job.route}</p>
                  </div>
                  <StatusBadge status={job.status} dot={false} />
                </button>
              ) : (
                <p className="text-xs text-slate-400">No job created yet. A job will be generated once this RRR is assigned.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Key Dates" />
            <CardBody className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Requested</span>
                <span className="font-medium text-brand-950">{formatDate(rrr.date, 'short')}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Required by</span>
                <span className="font-medium text-brand-950">{formatDate(rrr.requiredDate, 'short')}</span>
              </div>
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
      <div className="mt-0.5 text-[13.5px] text-slate-700">{value}</div>
    </div>
  );
}

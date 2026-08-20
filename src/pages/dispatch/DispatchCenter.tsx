import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Clock, MapPin, Send, Truck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Field, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { jobs as jobsData } from '@/data/jobs';
import { getCustomer } from '@/data/customers';
import { vehicles } from '@/data/vehicles';
import { drivers } from '@/data/drivers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import { alerts } from '@/data/alerts';
import type { Job } from '@/data/types';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';

export function DispatchCenter() {
  const [jobs, setJobs] = useState(jobsData);
  const [assignJob, setAssignJob] = useState<Job | null>(null);
  const [vehicleChoice, setVehicleChoice] = useState('');
  const [driverChoice, setDriverChoice] = useState('');
  const toast = useToast();

  const queue = jobs.filter((j) => ['New', 'Ready', 'Assigned'].includes(j.status));
  const active = jobs.filter((j) => ['Dispatched', 'In Transit'].includes(j.status));
  const availableVehicles = vehicles.filter((v) => v.status === 'Idle');
  const availableDrivers = drivers.filter((d) => d.status === 'Active');
  const dispatchAlerts = alerts.filter((a) => ['Dispatch', 'Trips', 'Jobs'].includes(a.module)).slice(0, 5);

  const stats = useMemo(() => ([
    { label: 'Unassigned Jobs', value: queue.length, tone: 'text-amber-600' },
    { label: 'Available Vehicles', value: availableVehicles.length, tone: 'text-teal-600' },
    { label: 'Available Drivers', value: availableDrivers.length, tone: 'text-sky-600' },
    { label: 'Active Dispatches', value: active.length, tone: 'text-brand-800' },
  ]), [queue.length, availableVehicles.length, availableDrivers.length, active.length]);

  function openAssign(job: Job) {
    setAssignJob(job);
    setVehicleChoice(job.vehicleId ?? '');
    setDriverChoice(job.driverId ?? '');
  }

  function confirmDispatch() {
    if (!assignJob || !vehicleChoice || !driverChoice) return;
    setJobs((prev) => prev.map((j) => (j.id === assignJob.id ? { ...j, vehicleId: vehicleChoice, driverId: driverChoice, status: 'Dispatched' } : j)));
    toast({ type: 'success', title: 'Job dispatched', description: `${assignJob.id} assigned to ${getVehicle(vehicleChoice)?.unitNumber} / ${getDriver(driverChoice)?.name}` });
    setAssignJob(null);
  }

  return (
    <div>
      <PageHeader
        title="Dispatch Center"
        description="Assign vehicles and drivers to pending jobs, and monitor active dispatches in real time."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Dispatch' }]}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <Card className="px-4 py-3.5">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={cn('mt-1 font-display text-2xl font-bold', s.tone)}>{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Dispatch Queue" subtitle="Jobs awaiting vehicle & driver assignment" />
            <div className="divide-y divide-slate-100">
              {queue.length === 0 && <div className="p-2"><EmptyState title="Queue clear" description="All jobs have been dispatched." /></div>}
              {queue.map((job) => {
                const customer = getCustomer(job.customerId);
                const v = getVehicle(job.vehicleId);
                const d = getDriver(job.driverId);
                return (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-brand-800">{job.id}</span>
                        <StatusBadge status={job.status} dot={false} />
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-slate-700">{customer?.name}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin size={11} /> {job.route}
                      </div>
                      {(v || d) && (
                        <div className="mt-1.5 flex gap-1.5">
                          {v && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-600"><Truck size={10} />{v.unitNumber}</span>}
                          {d && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-600"><UserRound size={10} />{d.name}</span>}
                        </div>
                      )}
                    </div>
                    <span className="hidden shrink-0 text-sm font-semibold text-brand-950 sm:block">{formatCurrency(job.revenue, { compact: true })}</span>
                    <Button size="sm" variant={job.vehicleId ? 'primary' : 'secondary'} icon={Send} onClick={() => openAssign(job)}>
                      {job.vehicleId ? 'Dispatch' : 'Assign'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader title="Active Dispatches" subtitle="Currently dispatched or in transit" />
            <div className="divide-y divide-slate-100">
              {active.map((job) => {
                const customer = getCustomer(job.customerId);
                const v = getVehicle(job.vehicleId);
                const d = getDriver(job.driverId);
                return (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-brand-800">{job.id}</span>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-slate-700">{customer?.name} — {job.route}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        {v && <span className="flex items-center gap-1"><Truck size={11} />{v.unitNumber}</span>}
                        {d && <span className="flex items-center gap-1"><UserRound size={11} />{d.name}</span>}
                      </div>
                    </div>
                    {job.tripId && (
                      <a href={`/trips/${job.tripId}`} className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                        {job.tripId} <ArrowRight size={12} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Available Vehicles" subtitle={`${availableVehicles.length} idle & ready`} />
            <div className="flex flex-col divide-y divide-slate-100">
              {availableVehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Truck size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{v.unitNumber}</p>
                    <p className="truncate text-[11px] text-slate-400">{v.type}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{v.location.split(',')[0]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Available Drivers" subtitle={`${availableDrivers.length} ready for dispatch`} />
            <div className="flex flex-col divide-y divide-slate-100">
              {availableDrivers.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{d.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{d.homeBranch}</p>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600">★ {d.rating}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Exceptions" subtitle="Dispatch-related issues" />
            <div className="flex flex-col divide-y divide-slate-100">
              {dispatchAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 px-5 py-2.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-brand-950">{a.title}</p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={10} />{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={!!assignJob}
        onClose={() => setAssignJob(null)}
        title={assignJob ? `Assign — ${assignJob.id}` : ''}
        subtitle={assignJob ? getCustomer(assignJob.customerId)?.name : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignJob(null)}>Cancel</Button>
            <Button variant="primary" icon={Send} disabled={!vehicleChoice || !driverChoice} onClick={confirmDispatch}>Confirm Dispatch</Button>
          </>
        }
      >
        {assignJob && (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Route</p>
              <div className="flex items-center gap-2 text-sm text-brand-950">
                <MapPin size={14} className="text-brand-700" /> {assignJob.route}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Scheduled: {assignJob.scheduledDate}</span>
                <span className="font-semibold text-brand-950">{formatCurrency(assignJob.revenue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 py-2">
              <StepDot label="Job" active />
              <ArrowRight size={14} className="text-slate-300" />
              <StepDot label="Vehicle" active={!!vehicleChoice} />
              <ArrowRight size={14} className="text-slate-300" />
              <StepDot label="Driver" active={!!driverChoice} />
            </div>

            <Field label="Assign Vehicle" required>
              <Select
                value={vehicleChoice}
                onChange={(e) => setVehicleChoice(e.target.value)}
                placeholder="Select an available vehicle"
                options={vehicles.filter((v) => v.status === 'Idle' || v.id === assignJob.vehicleId).map((v) => ({ label: `${v.unitNumber} — ${v.type} (${v.registration})`, value: v.id }))}
              />
            </Field>
            <Field label="Assign Driver" required>
              <Select
                value={driverChoice}
                onChange={(e) => setDriverChoice(e.target.value)}
                placeholder="Select an available driver"
                options={drivers.filter((d) => d.status === 'Active' || d.id === assignJob.driverId).map((d) => ({ label: `${d.name} — ${d.homeBranch}`, value: d.id }))}
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function StepDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', active ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-400')}>
        {active ? '✓' : ''}
      </span>
      <span className="text-[10.5px] text-slate-500">{label}</span>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/lib/auth';
import { opsApi, type Job, type Vehicle, type Driver, type AlertItem } from '@/lib/opsApi';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';

export function DispatchCenter() {
  const { can } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [exceptions, setExceptions] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignJob, setAssignJob] = useState<Job | null>(null);
  const [vehicleChoice, setVehicleChoice] = useState('');
  const [driverChoice, setDriverChoice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    Promise.all([
      opsApi.jobs.list({ status: 'Created,Assigned', limit: 100 }, signal),
      opsApi.jobs.list({ status: 'Dispatched,In Progress', limit: 100 }, signal),
      opsApi.vehicles.list({ status: 'Available', limit: 200 }, signal),
      opsApi.drivers.list({ status: 'Active', limit: 200 }, signal),
      opsApi.alerts.list({ limit: 10 }, signal),
    ])
      .then(([queueRes, activeRes, vehiclesRes, driversRes, alertsRes]) => {
        setJobs([...queueRes.items, ...activeRes.items]);
        setVehicles(vehiclesRes.items);
        setDrivers(driversRes.items);
        setExceptions(alertsRes.items.filter((a) => ['Dispatch', 'Trips', 'Jobs'].includes(a.module)).slice(0, 5));
        setError(null);
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load dispatch data'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const queue = jobs.filter((j) => j.status === 'Created' || j.status === 'Assigned');
  const active = jobs.filter((j) => j.status === 'Dispatched' || j.status === 'In Progress');

  const stats = useMemo(() => ([
    { label: 'Unassigned Jobs', value: queue.filter((j) => j.status === 'Created').length, tone: 'text-amber-600' },
    { label: 'Available Vehicles', value: vehicles.length, tone: 'text-teal-600' },
    { label: 'Available Drivers', value: drivers.length, tone: 'text-sky-600' },
    { label: 'Active Dispatches', value: active.length, tone: 'text-brand-800' },
  ]), [queue, vehicles.length, drivers.length, active.length]);

  function openAssign(job: Job) {
    setAssignJob(job);
    setVehicleChoice(job.vehicleId ?? '');
    setDriverChoice(job.driverId ?? '');
  }

  async function confirmAssign() {
    if (!assignJob || !vehicleChoice || !driverChoice) return;
    setBusy(true);
    try {
      await opsApi.jobs.update(assignJob.id, { vehicleId: vehicleChoice, driverId: driverChoice });
      toast({ type: 'success', title: 'Job assigned', description: `${assignJob.ref} — ready to dispatch` });
      setAssignJob(null);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not assign job', description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setBusy(false);
    }
  }

  async function dispatchJob(job: Job) {
    setBusy(true);
    try {
      const trip = await opsApi.trips.dispatch(job.id, { startLocation: job.pickup });
      toast({ type: 'success', title: 'Job dispatched', description: `${job.ref} → ${trip.ref}` });
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not dispatch', description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Dispatch Center"
        description="Assign vehicles and drivers to pending jobs, and monitor active dispatches in real time."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Dispatch' }]}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

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
            <CardHeader title="Dispatch Queue" subtitle="Jobs awaiting assignment or ready to dispatch" />
            <div className="divide-y divide-slate-100">
              {!loading && queue.length === 0 && <div className="p-2"><EmptyState title="Queue clear" description="All jobs have been dispatched." /></div>}
              {queue.map((job) => (
                <div key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-brand-800">{job.ref}</span>
                      <StatusBadge status={job.status} dot={false} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-slate-700">{job.customerName}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin size={11} /> {job.pickup} → {job.destination}
                    </div>
                    {(job.vehicleRef || job.driverName) && (
                      <div className="mt-1.5 flex gap-1.5">
                        {job.vehicleRef && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-600"><Truck size={10} />{job.vehicleRef}</span>}
                        {job.driverName && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-600"><UserRound size={10} />{job.driverName}</span>}
                      </div>
                    )}
                  </div>
                  <span className="hidden shrink-0 text-sm font-semibold text-brand-950 sm:block">{formatCurrency(job.revenue, { compact: true })}</span>
                  {can('dispatch:manage') && (
                    job.status === 'Assigned' ? (
                      <Button size="sm" variant="primary" icon={Send} disabled={busy} onClick={() => dispatchJob(job)}>Dispatch</Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Send} disabled={busy} onClick={() => openAssign(job)}>Assign</Button>
                    )
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader title="Active Dispatches" subtitle="Currently dispatched or in progress" />
            <div className="divide-y divide-slate-100">
              {!loading && active.length === 0 && <div className="p-2"><EmptyState title="Nothing active" description="Dispatch a job to see it here." /></div>}
              {active.map((job) => (
                <div key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-brand-800">{job.ref}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-slate-700">{job.customerName} — {job.pickup} → {job.destination}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      {job.vehicleRef && <span className="flex items-center gap-1"><Truck size={11} />{job.vehicleRef}</span>}
                      {job.driverName && <span className="flex items-center gap-1"><UserRound size={11} />{job.driverName}</span>}
                    </div>
                  </div>
                  {job.tripId && (
                    <a href={`/app/trips/${job.tripId}`} className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                      {job.tripRef} <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Available Vehicles" subtitle={`${vehicles.length} ready`} />
            <div className="flex flex-col divide-y divide-slate-100">
              {vehicles.slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Truck size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{v.unitNumber}</p>
                    <p className="truncate text-[11px] text-slate-400">{v.type}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{v.homeBranch ?? ''}</span>
                </div>
              ))}
              {vehicles.length === 0 && !loading && <div className="p-4"><EmptyState title="No vehicles available" description="Add vehicles under Fleet." /></div>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Available Drivers" subtitle={`${drivers.length} ready`} />
            <div className="flex flex-col divide-y divide-slate-100">
              {drivers.slice(0, 8).map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{d.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{d.homeBranch ?? ''}</p>
                  </div>
                </div>
              ))}
              {drivers.length === 0 && !loading && <div className="p-4"><EmptyState title="No drivers available" description="Add drivers under Fleet." /></div>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Exceptions" subtitle="Dispatch-related alerts" />
            <div className="flex flex-col divide-y divide-slate-100">
              {exceptions.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 px-5 py-2.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-brand-950">{a.title}</p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={10} />{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
              {exceptions.length === 0 && <p className="px-5 py-4 text-xs text-slate-400">No exceptions right now.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={!!assignJob}
        onClose={() => setAssignJob(null)}
        title={assignJob ? `Assign — ${assignJob.ref}` : ''}
        subtitle={assignJob?.customerName}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignJob(null)}>Cancel</Button>
            <Button variant="primary" icon={Send} disabled={!vehicleChoice || !driverChoice || busy} onClick={confirmAssign}>Confirm Assignment</Button>
          </>
        }
      >
        {assignJob && (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Route</p>
              <div className="flex items-center gap-2 text-sm text-brand-950">
                <MapPin size={14} className="text-brand-700" /> {assignJob.pickup} → {assignJob.destination}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Scheduled: {new Date(assignJob.scheduledDate).toLocaleDateString()}</span>
                <span className="font-semibold text-brand-950">{formatCurrency(assignJob.revenue)}</span>
              </div>
            </div>

            <Field label="Assign Vehicle" required>
              <Select
                value={vehicleChoice}
                onChange={(e) => setVehicleChoice(e.target.value)}
                placeholder="Select an available vehicle"
                options={vehicles.map((v) => ({ label: `${v.unitNumber} — ${v.type} (${v.registration})`, value: v.id }))}
              />
            </Field>
            <Field label="Assign Driver" required>
              <Select
                value={driverChoice}
                onChange={(e) => setDriverChoice(e.target.value)}
                placeholder="Select an available driver"
                options={drivers.map((d) => ({ label: `${d.name}${d.homeBranch ? ` — ${d.homeBranch}` : ''}`, value: d.id }))}
              />
            </Field>
            {vehicles.length === 0 || drivers.length === 0 ? (
              <p className="text-xs text-amber-600">Add more vehicles/drivers under Fleet if none are available.</p>
            ) : null}
          </div>
        )}
      </Drawer>
    </div>
  );
}

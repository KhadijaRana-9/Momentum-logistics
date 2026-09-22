import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowRight, Building2, Calendar, Gauge, MapPin, Printer, Route as RouteIcon, Truck, UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { WorkflowStepper } from '@/components/ui/WorkflowStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth';
import { opsApi, TRIP_STATUSES, type Trip, type Expense, type FuelVoucher } from '@/lib/opsApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export function TripSheet() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuel, setFuel] = useState<FuelVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFoundErr, setNotFoundErr] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    Promise.all([
      opsApi.trips.get(id),
      opsApi.expenses.list({ tripId: id, limit: 50 }),
      opsApi.fuel.list({ tripId: id, limit: 50 }),
    ])
      .then(([t, e, f]) => { setTrip(t); setExpenses(e.items); setFuel(f.items); setNotFoundErr(false); })
      .catch(() => setNotFoundErr(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading trip sheet…</div>;

  if (notFoundErr || !trip) {
    return (
      <div>
        <PageHeader title="Trip Not Found" breadcrumbs={[{ label: 'Operations' }, { label: 'Trips', to: '/app/trips' }]} />
        <Card><EmptyState title="Trip not found" description="This trip sheet may have been removed." /></Card>
      </div>
    );
  }

  const fuelCost = fuel.reduce((s, f) => s + f.total, 0);
  const expenseCost = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = fuelCost + expenseCost;
  const stageIdx = TRIP_STATUSES.indexOf(trip.status);
  const nextStage = stageIdx >= 0 && stageIdx < TRIP_STATUSES.length - 1 ? TRIP_STATUSES[stageIdx + 1] : null;

  async function advance() {
    if (!nextStage || !trip) return;
    setBusy(true);
    try {
      const updated = await opsApi.trips.setStatus(trip.id, nextStage);
      setTrip(updated);
      toast({ type: 'success', title: 'Trip status updated', description: `${trip.ref} moved to ${nextStage}` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not update trip', description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={trip.ref}
        breadcrumbs={[{ label: 'Operations' }, { label: 'Trips', to: '/app/trips' }, { label: trip.ref }]}
        description={`${trip.route} — Job ${trip.jobRef} · RRR ${trip.rrrRef}`}
        actions={<>
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Print Trip Sheet</Button>
          {nextStage && can('trips:manage') && <Button variant="primary" size="sm" icon={ArrowRight} disabled={busy} onClick={advance}>Mark as {nextStage}</Button>}
        </>}
      />

      <Card className="mb-5 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trip Progression</span>
          <StatusBadge status={trip.status} />
        </div>
        <WorkflowStepper stages={TRIP_STATUSES} current={trip.status} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader title="Journey Details" />
            <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Info icon={MapPin} label="Start Location" value={trip.startLocation ?? '—'} />
              <Info icon={MapPin} label="End Location" value={trip.endLocation ?? '—'} />
              <Info icon={Calendar} label="Start Time" value={formatDateTime(trip.startTime)} />
              <Info icon={Calendar} label="End Time" value={trip.endTime ? formatDateTime(trip.endTime) : 'In progress'} />
              <Info icon={Gauge} label="Start Odometer" value={trip.startOdometer != null ? `${trip.startOdometer.toLocaleString()} km` : 'Not logged'} />
              <Info icon={Gauge} label="End Odometer" value={trip.endOdometer != null ? `${trip.endOdometer.toLocaleString()} km` : 'Pending'} />
              <Info icon={RouteIcon} label="Distance" value={trip.distanceKm != null ? `${trip.distanceKm} km` : 'Pending odometer readings'} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vehicle & Driver" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Truck size={18} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{trip.vehicleRef}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={18} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{trip.driverName}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Fuel & Expenses" subtitle="Recorded against this trip from the Finance module" />
            <div className="divide-y divide-slate-100 px-5">
              {fuel.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-600">Fuel — {f.station ?? f.ref} <span className="text-xs text-slate-400">({f.litres} L)</span></span>
                  <span className="font-medium text-brand-950">{formatCurrency(f.total)}</span>
                </div>
              ))}
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-600">{e.category} {e.description && <span className="text-xs text-slate-400">({e.description})</span>}</span>
                  <span className="font-medium text-brand-950">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              {fuel.length === 0 && expenses.length === 0 && (
                <p className="py-4 text-xs text-slate-400">No fuel or expense entries logged against this trip yet — add them from Finance → Fuel / Expenses.</p>
              )}
              <div className="flex items-center justify-between py-3 text-[13px] font-semibold">
                <span className="text-brand-950">Total Trip Cost</span>
                <span className="text-brand-950">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Cost Summary" />
            <CardBody className="flex flex-col gap-3">
              <SummaryRow label="Fuel Cost" value={formatCurrency(fuelCost)} />
              <SummaryRow label="Other Expenses" value={formatCurrency(expenseCost)} />
              <div className="border-t border-slate-100 pt-3">
                <SummaryRow label="Total Cost" value={formatCurrency(totalCost)} strong />
              </div>
              <p className="text-[11px] text-slate-400">Revenue and billing for this trip are tracked on its Job and any linked Invoice.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <CardBody className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Building2 size={16} /></span>
                <p className="text-[13px] font-semibold text-brand-950">{trip.customerName}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-[13.5px] text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'text-[13px] font-medium text-slate-600' : 'text-[13px] text-slate-500'}>{label}</span>
      <span className={strong ? 'text-base font-bold text-brand-950' : 'text-[13px] font-medium text-brand-950'}>{value}</span>
    </div>
  );
}

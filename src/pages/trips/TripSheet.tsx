import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Building2, Calendar, Fuel, Gauge, MapPin,
  Phone, Printer, Receipt, Route as RouteIcon, ShieldCheck, Truck, UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { WorkflowStepper } from '@/components/ui/WorkflowStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { getTrip, tripCost, tripProfit, TRIP_STAGES } from '@/data/trips';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export function TripSheet() {
  const { id } = useParams();
  const toast = useToast();
  const initial = getTrip(id);
  const [status, setStatus] = useState(initial?.status);

  if (!initial) {
    return (
      <div>
        <PageHeader title="Trip Not Found" breadcrumbs={[{ label: 'Operations' }, { label: 'Trips', to: '/app/trips' }]} />
        <Card><EmptyState title="Trip not found" description="This trip sheet may have been removed." /></Card>
      </div>
    );
  }

  const trip = { ...initial, status: status ?? initial.status };
  const customer = getCustomer(trip.customerId);
  const vehicle = getVehicle(trip.vehicleId);
  const driver = getDriver(trip.driverId);
  const cost = tripCost(trip);
  const profit = tripProfit(trip);
  const margin = trip.revenue ? (profit / trip.revenue) * 100 : 0;
  const isDelayed = trip.status === 'Delayed';
  const stageIdx = TRIP_STAGES.indexOf(trip.status as (typeof TRIP_STAGES)[number]);
  const currentStage = stageIdx >= 0 ? trip.status : 'In Transit';
  const nextStage = stageIdx >= 0 && stageIdx < TRIP_STAGES.length - 1 ? TRIP_STAGES[stageIdx + 1] : null;

  function advance() {
    if (!nextStage) return;
    setStatus(nextStage);
    toast({ type: 'success', title: 'Trip status updated', description: `${trip.id} moved to ${nextStage}` });
  }

  const expenseRows = [
    { label: 'Fuel', value: trip.fuelCost, detail: `${trip.fuelLitres} L` },
    { label: 'Tolls', value: trip.tolls },
    { label: 'Meals & Allowance', value: trip.meals },
    { label: 'Loading / Unloading', value: trip.loadingCharges },
    { label: 'Miscellaneous', value: trip.miscExpenses },
    { label: 'Driver Incentives', value: trip.incentives },
  ];

  return (
    <div>
      <PageHeader
        title={trip.id}
        breadcrumbs={[{ label: 'Operations' }, { label: 'Trips', to: '/app/trips' }, { label: trip.id }]}
        description={`${trip.route} — Job ${trip.jobId} · RRR ${trip.rrrId}`}
        actions={<>
          <Button variant="secondary" size="sm" icon={Printer}>Print Trip Sheet</Button>
          {nextStage && <Button variant="primary" size="sm" icon={ArrowRight} onClick={advance}>Mark as {nextStage}</Button>}
        </>}
      />

      {isDelayed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 text-rose-600" />
          <div>
            <p className="text-[13px] font-semibold text-rose-700">This trip is running behind schedule</p>
            <p className="text-xs text-rose-600">ETA {trip.eta ? formatDateTime(trip.eta) : 'unknown'} — dispatcher has been notified</p>
          </div>
        </div>
      )}

      <Card className="mb-5 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trip Progression</span>
          <StatusBadge status={trip.status} />
        </div>
        <WorkflowStepper stages={TRIP_STAGES} current={currentStage} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader title="Journey Details" />
            <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Info icon={MapPin} label="Start Location" value={trip.startLocation} />
              <Info icon={MapPin} label="End Location" value={trip.endLocation} />
              <Info icon={Calendar} label="Start Time" value={formatDateTime(trip.startTime)} />
              <Info icon={Calendar} label="End Time" value={trip.endTime ? formatDateTime(trip.endTime) : trip.eta ? `ETA ${formatDateTime(trip.eta)}` : 'In progress'} />
              <Info icon={Gauge} label="Start Odometer" value={`${trip.startOdometer.toLocaleString()} km`} />
              <Info icon={Gauge} label="End Odometer" value={trip.endOdometer ? `${trip.endOdometer.toLocaleString()} km` : 'Pending'} />
              <Info icon={RouteIcon} label="Distance" value={`${trip.distance} km`} />
              <Info icon={Fuel} label="Fuel Consumption" value={trip.fuelLitres ? `${trip.fuelLitres} L (${(trip.distance / (trip.fuelLitres || 1)).toFixed(1)} km/L)` : 'Not yet logged'} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vehicle & Driver" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Truck size={18} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{vehicle?.unitNumber} — {vehicle?.type}</p>
                  <p className="truncate text-xs text-slate-400">{vehicle?.registration} · {vehicle?.make} {vehicle?.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={18} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{driver?.name}</p>
                  <p className="truncate text-xs text-slate-400">{driver?.licenseNumber} · {driver?.phone}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Expenses & Charges" subtitle="Recorded against this trip sheet" />
            <div className="divide-y divide-slate-100 px-5">
              {expenseRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-600">{row.label} {row.detail && <span className="text-xs text-slate-400">({row.detail})</span>}</span>
                  <span className="font-medium text-brand-950">{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 text-[13px] font-semibold">
                <span className="text-brand-950">Total Trip Cost</span>
                <span className="text-brand-950">{formatCurrency(cost)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Financial Summary" />
            <CardBody className="flex flex-col gap-3">
              <SummaryRow label="Revenue" value={formatCurrency(trip.revenue)} />
              <SummaryRow label="Total Cost" value={formatCurrency(cost)} />
              <div className="border-t border-slate-100 pt-3">
                <SummaryRow label="Gross Profit" value={formatCurrency(profit)} strong tone={profit >= 0 ? 'success' : 'danger'} />
                <SummaryRow label="Margin" value={`${margin.toFixed(1)}%`} strong tone={margin >= 0 ? 'success' : 'danger'} />
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Driver Advance</span>
                <span className="text-right font-medium text-brand-950">{formatCurrency(trip.advance)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <CardBody className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Building2 size={16} /></span>
                <p className="text-[13px] font-semibold text-brand-950">{customer?.name}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} /> {customer?.contactPhone}</div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Receipts & Documents" />
            <CardBody className="flex flex-col gap-2">
              {['Fuel Receipt.jpg', 'Toll Receipt.pdf', 'POD — Signed.pdf'].map((doc) => (
                <div key={doc} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2">
                  <Receipt size={14} className="text-slate-400" />
                  <span className="flex-1 truncate text-xs font-medium text-slate-600">{doc}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          {trip.status === 'Verified' || trip.status === 'Financially Closed' ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <ShieldCheck size={17} className="text-emerald-600" />
              <p className="text-xs font-medium text-emerald-700">Trip sheet verified and reconciled</p>
            </div>
          ) : null}
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

function SummaryRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'success' | 'danger' }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'text-[13px] font-medium text-slate-600' : 'text-[13px] text-slate-500'}>{label}</span>
      <span className={
        strong
          ? tone === 'success' ? 'text-base font-bold text-emerald-600' : tone === 'danger' ? 'text-base font-bold text-rose-600' : 'text-base font-bold text-brand-950'
          : 'text-[13px] font-medium text-brand-950'
      }>{value}</span>
    </div>
  );
}

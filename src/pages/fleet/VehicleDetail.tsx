import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Gauge, MapPin, ShieldCheck, Truck, UserRound, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { opsApi, type Vehicle, type Trip, type MaintenanceOrder, type FuelVoucher } from '@/lib/opsApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function VehicleDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maint, setMaint] = useState<MaintenanceOrder[]>([]);
  const [fuel, setFuel] = useState<FuelVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      opsApi.vehicles.get(id),
      opsApi.trips.list({ vehicleId: id, limit: 100 }),
      opsApi.maintenance.list({ vehicleId: id, limit: 100 }),
      opsApi.fuel.list({ vehicleId: id, limit: 100 }),
    ])
      .then(([v, t, m, f]) => { setVehicle(v); setTrips(t.items); setMaint(m.items); setFuel(f.items); })
      .catch(() => setVehicle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading vehicle…</div>;

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle Not Found" breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/app/fleet/vehicles' }]} />
        <Card><EmptyState title="Vehicle not found" /></Card>
      </div>
    );
  }

  const maintCost = maint.reduce((s, m) => s + m.totalCost, 0);
  const fuelCost = fuel.reduce((s, f) => s + f.total, 0);

  return (
    <div>
      <PageHeader
        title={`${vehicle.unitNumber} — ${vehicle.registration}`}
        description={`${[vehicle.make, vehicle.model].filter(Boolean).join(' ') || vehicle.type}${vehicle.year ? ` (${vehicle.year})` : ''} · ${vehicle.type}`}
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/app/fleet/vehicles' }, { label: vehicle.unitNumber }]}
        actions={<StatusBadge status={vehicle.status} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Odometer</p><p className="mt-1 font-display text-xl font-bold text-brand-950">{vehicle.odometer.toLocaleString()} km</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Trips</p><p className="mt-1 font-display text-xl font-bold text-sky-600">{trips.length}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Fuel Cost</p><p className="mt-1 font-display text-xl font-bold text-brand-950">{formatCurrency(fuelCost, { compact: true })}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Maintenance Cost</p><p className="mt-1 font-display text-xl font-bold text-orange-600">{formatCurrency(maintCost, { compact: true })}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              className="px-5 pt-3" value={tab} onChange={setTab}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'maintenance', label: 'Maintenance', count: maint.length },
                { id: 'fuel', label: 'Fuel', count: fuel.length },
                { id: 'trips', label: 'Trips', count: trips.length },
              ]}
            />

            {tab === 'overview' && (
              <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info icon={Truck} label="Vehicle Type" value={vehicle.type} />
                <Info icon={Gauge} label="Home Branch" value={vehicle.homeBranch ?? '—'} />
                <Info icon={Calendar} label="Last Service" value={vehicle.lastServiceDate ? formatDate(vehicle.lastServiceDate) : 'Not recorded'} />
                <Info icon={Wrench} label="Next Service Due" value={vehicle.nextServiceDue ? formatDate(vehicle.nextServiceDue) : 'Not scheduled'} />
                <Info icon={ShieldCheck} label="Insurance Expiry" value={vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : 'Not recorded'} />
                <Info icon={ShieldCheck} label="Registration Expiry" value={vehicle.registrationExpiry ? formatDate(vehicle.registrationExpiry) : 'Not recorded'} />
              </CardBody>
            )}

            {tab === 'maintenance' && (
              <div className="divide-y divide-slate-100">
                {maint.length === 0 && <div className="p-2"><EmptyState title="No maintenance history" description="This vehicle has no recorded work orders." /></div>}
                {maint.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Wrench size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{m.problem}</p>
                      <p className="text-xs text-slate-400">{m.ref} · {formatDate(m.startDate, 'short')}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(m.totalCost)}</span>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'fuel' && (
              <div className="divide-y divide-slate-100">
                {fuel.length === 0 && <div className="p-2"><EmptyState title="No fuel records" /></div>}
                {fuel.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Gauge size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{f.station ?? f.ref}</p>
                      <p className="text-xs text-slate-400">{f.litres} L · {formatDate(f.date, 'short')}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(f.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'trips' && (
              <div className="divide-y divide-slate-100">
                {trips.length === 0 && <div className="p-2"><EmptyState title="No trips recorded" /></div>}
                {trips.map((t) => (
                  <button key={t.id} onClick={() => navigate(`/app/trips/${t.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{t.ref} — {t.route}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.startTime, 'short')}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Assigned Driver" />
            <CardBody>
              {vehicle.driverId ? (
                <button onClick={() => navigate(`/app/fleet/drivers/${vehicle.driverId}`)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{vehicle.driverName}</p>
                  </div>
                </button>
              ) : (
                <p className="text-xs text-slate-400">No driver currently assigned to this vehicle.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vehicle P&L" subtitle="All-time" />
            <CardBody className="flex flex-col gap-2.5">
              <p className="text-xs text-slate-400">Revenue is tracked on completed Jobs. See the full profit &amp; loss breakdown for this vehicle:</p>
              <Button variant="outline" size="sm" className="mt-1 w-full" onClick={() => navigate('/app/finance/vehicle-pnl')}>View Full P&L</Button>
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

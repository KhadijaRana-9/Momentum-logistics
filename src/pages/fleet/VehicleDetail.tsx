import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar, FileText, Fuel, Gauge, MapPin, Pencil, Phone,
  Satellite, ShieldCheck, Truck, UserRound, Wrench, WifiOff,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { getVehicle, vehicles } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import { maintenanceOrders, maintenanceCost } from '@/data/maintenance';
import { fuelVouchers } from '@/data/fuel';
import { trips, tripCost, tripProfit } from '@/data/trips';
import { formatCurrency, formatDate } from '@/lib/utils';

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const vehicle = getVehicle(id);

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle Not Found" breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/app/fleet/vehicles' }]} />
        <Card><EmptyState title="Vehicle not found" /></Card>
      </div>
    );
  }

  const driver = getDriver(vehicle.driverId);
  const vTrips = trips.filter((t) => t.vehicleId === vehicle.id);
  const vMaint = maintenanceOrders.filter((m) => m.vehicleId === vehicle.id);
  const vFuel = fuelVouchers.filter((f) => f.vehicleId === vehicle.id);
  const revenue = vTrips.reduce((s, t) => s + t.revenue, 0);
  const cost = vTrips.reduce((s, t) => s + tripCost(t), 0) + vMaint.reduce((s, m) => s + maintenanceCost(m), 0);
  const profit = revenue - cost;

  return (
    <div>
      <PageHeader
        title={`${vehicle.unitNumber} — ${vehicle.registration}`}
        description={`${vehicle.make} ${vehicle.model} (${vehicle.year}) · ${vehicle.type}`}
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/app/fleet/vehicles' }, { label: vehicle.unitNumber }]}
        actions={<>
          <StatusBadge status={vehicle.status} />
          <Button variant="secondary" size="sm" icon={Pencil}>Edit</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500">Odometer</p>
          <p className="mt-1 font-display text-xl font-bold text-brand-950">{vehicle.odometer.toLocaleString()} km</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500">Fuel Level</p>
          <p className="mt-1 font-display text-xl font-bold text-brand-950">{vehicle.fuelLevel}%</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500">Utilization</p>
          <p className="mt-1 font-display text-xl font-bold text-sky-600">{vehicle.utilization}%</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500">Tracker</p>
          <p className="mt-1 flex items-center gap-1.5 font-display text-xl font-bold text-brand-950">
            {vehicle.trackerStatus === 'Offline' ? <WifiOff size={17} className="text-rose-500" /> : <Satellite size={17} className="text-emerald-500" />}
            {vehicle.trackerStatus}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              className="px-5 pt-3"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'maintenance', label: 'Maintenance', count: vMaint.length },
                { id: 'fuel', label: 'Fuel', count: vFuel.length },
                { id: 'trips', label: 'Trips', count: vTrips.length },
                { id: 'documents', label: 'Documents' },
              ]}
            />

            {tab === 'overview' && (
              <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info icon={Truck} label="Vehicle Type" value={vehicle.type} />
                <Info icon={Gauge} label="Home Branch" value={vehicle.homeBranch} />
                <Info icon={MapPin} label="Current Location" value={vehicle.location} />
                <Info icon={Calendar} label="Last Service" value={formatDate(vehicle.lastServiceDate)} />
                <Info icon={Wrench} label="Next Service Due" value={`${formatDate(vehicle.nextServiceDue)} — ${vehicle.nextServiceKm.toLocaleString()} km`} />
                <Info icon={ShieldCheck} label="Insurance Expiry" value={formatDate(vehicle.insuranceExpiry)} />
              </CardBody>
            )}

            {tab === 'maintenance' && (
              <div className="divide-y divide-slate-100">
                {vMaint.length === 0 && <div className="p-2"><EmptyState title="No maintenance history" description="This vehicle has no recorded work orders." /></div>}
                {vMaint.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Wrench size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{m.problem}</p>
                      <p className="text-xs text-slate-400">{m.id} · {formatDate(m.startDate, 'short')}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(maintenanceCost(m))}</span>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'fuel' && (
              <div className="divide-y divide-slate-100">
                {vFuel.length === 0 && <div className="p-2"><EmptyState title="No fuel records" /></div>}
                {vFuel.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Fuel size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{f.station}</p>
                      <p className="text-xs text-slate-400">{f.litres} L · {formatDate(f.date, 'short')}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(f.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'trips' && (
              <div className="divide-y divide-slate-100">
                {vTrips.length === 0 && <div className="p-2"><EmptyState title="No trips recorded" /></div>}
                {vTrips.map((t) => (
                  <button key={t.id} onClick={() => navigate(`/app/trips/${t.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{t.id} — {t.route}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.startTime, 'short')}</p>
                    </div>
                    <span className={`text-[13px] font-semibold ${tripProfit(t) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(tripProfit(t))}</span>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            )}

            {tab === 'documents' && (
              <div className="flex flex-col gap-2 p-5">
                {[
                  { label: 'Vehicle Registration', expiry: vehicle.registrationExpiry },
                  { label: 'Insurance Certificate', expiry: vehicle.insuranceExpiry },
                ].map((doc) => (
                  <div key={doc.label} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={15} /></span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-slate-700">{doc.label}</p>
                      <p className="text-xs text-slate-400">Expires {formatDate(doc.expiry)}</p>
                    </div>
                    <Button variant="ghost" size="xs">View</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Assigned Driver" />
            <CardBody>
              {driver ? (
                <button onClick={() => navigate(`/app/fleet/drivers/${driver.id}`)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{driver.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400"><Phone size={11} /> {driver.phone}</p>
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
              <div className="flex items-center justify-between text-[13px]"><span className="text-slate-500">Total Revenue</span><span className="font-medium text-brand-950">{formatCurrency(revenue)}</span></div>
              <div className="flex items-center justify-between text-[13px]"><span className="text-slate-500">Total Cost</span><span className="font-medium text-brand-950">{formatCurrency(cost)}</span></div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[13px] font-semibold">
                <span className="text-brand-950">Net Profit</span>
                <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(profit)}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-1 w-full" onClick={() => navigate('/app/finance/vehicle-pnl')}>View Full P&L</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Similar Vehicles" subtitle={vehicle.type} />
            <CardBody className="flex flex-col gap-2">
              {vehicles.filter((v) => v.type === vehicle.type && v.id !== vehicle.id).slice(0, 3).map((v) => (
                <button key={v.id} onClick={() => navigate(`/app/fleet/vehicles/${v.id}`)} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50">
                  <span className="text-[12.5px] font-medium text-slate-700">{v.unitNumber}</span>
                  <StatusBadge status={v.status} dot={false} />
                </button>
              ))}
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

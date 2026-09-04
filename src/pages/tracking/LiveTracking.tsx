import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Fuel, Gauge, MapPin, Navigation, Satellite, Signal, Truck, UserRound, WifiOff,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Timeline } from '@/components/ui/Timeline';
import { FleetMap } from '@/components/tracking/FleetMap';
import { vehicles } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import { trips } from '@/data/trips';
import { cn, formatDateTime } from '@/lib/utils';

function tripForVehicle(vehicleId: string) {
  return trips.find((t) => t.vehicleId === vehicleId && !t.endTime);
}

function mockEvents(vehicleId: string) {
  const seed = vehicleId.charCodeAt(4) + vehicleId.charCodeAt(6);
  const now = Date.now();
  return [
    { title: 'Tracker ping received', description: 'Location updated', timestamp: new Date(now - seed * 1000).toISOString(), icon: Satellite, tone: 'success' as const },
    { title: 'Speed recorded: 84 km/h', description: 'Within posted limit', timestamp: new Date(now - (seed + 12) * 60000).toISOString(), icon: Gauge, tone: 'brand' as const },
    { title: 'Entered geofence zone', description: 'Approaching hub checkpoint', timestamp: new Date(now - (seed + 40) * 60000).toISOString(), icon: MapPin, tone: 'brand' as const },
    { title: 'Fuel level updated', description: `${vehicles.find((v) => v.id === vehicleId)?.fuelLevel}% remaining`, timestamp: new Date(now - (seed + 95) * 60000).toISOString(), icon: Fuel, tone: 'warning' as const },
  ];
}

export function LiveTracking() {
  const [selectedId, setSelectedId] = useState<string | null>('VEH-101');
  const navigate = useNavigate();

  const destinations = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const v of vehicles) {
      const trip = tripForVehicle(v.id);
      map[v.id] = trip?.endLocation;
    }
    return map;
  }, []);

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;
  const selectedDriver = getDriver(selected?.driverId);
  const selectedTrip = selected ? tripForVehicle(selected.id) : undefined;

  const summary = {
    moving: vehicles.filter((v) => v.status === 'Moving').length,
    idle: vehicles.filter((v) => v.status === 'Idle').length,
    offline: vehicles.filter((v) => v.status === 'Offline').length,
    maintenance: vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'Out of Service').length,
  };

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        description="Real-time fleet positioning across the network — click a vehicle to inspect its status."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Live Tracking' }]}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Moving</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.moving}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Idle</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.idle}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Offline</p><p className="mt-1 font-display text-2xl font-bold text-slate-500">{summary.offline}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Maintenance</p><p className="mt-1 font-display text-2xl font-bold text-orange-600">{summary.maintenance}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <FleetMap vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} destinations={destinations} />
          </Card>

          <Card className="mt-5">
            <CardHeader title="Fleet Status" subtitle="Click a vehicle to locate it on the map" />
            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={cn('flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-slate-50', selectedId === v.id && 'bg-brand-50/60')}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Truck size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{v.unitNumber}</p>
                    <p className="truncate text-[11px] text-slate-400">{v.location}</p>
                  </div>
                  <StatusBadge status={v.status} dot={false} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {selected ? (
            <>
              <Card>
                <CardHeader
                  title={selected.unitNumber}
                  subtitle={selected.registration}
                  action={<StatusBadge status={selected.status} />}
                />
                <div className="flex flex-col gap-3 px-5 pb-5">
                  <div className="flex items-center gap-2 text-[13px] text-slate-600"><MapPin size={14} className="text-slate-400" /> {selected.location}</div>
                  {selectedDriver && (
                    <button onClick={() => navigate(`/app/fleet/drivers/${selectedDriver.id}`)} className="flex items-center gap-2 text-[13px] text-slate-600 hover:text-brand-700">
                      <UserRound size={14} className="text-slate-400" /> {selectedDriver.name}
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    <MiniStat icon={Gauge} label="Odometer" value={`${selected.odometer.toLocaleString()} km`} />
                    <MiniStat icon={Fuel} label="Fuel" value={`${selected.fuelLevel}%`} />
                    <MiniStat icon={selected.trackerStatus === 'Offline' ? WifiOff : Signal} label="Tracker" value={selected.trackerStatus} />
                    <MiniStat icon={Navigation} label="Utilization" value={`${selected.utilization}%`} />
                  </div>
                  {selectedTrip && (
                    <button onClick={() => navigate(`/app/trips/${selectedTrip.id}`)} className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                      <div>
                        <p className="text-[12.5px] font-semibold text-brand-950">{selectedTrip.id}</p>
                        <p className="text-[11px] text-slate-400">ETA {selectedTrip.eta ? formatDateTime(selectedTrip.eta) : '—'}</p>
                      </div>
                      <ArrowRight size={14} className="text-brand-600" />
                    </button>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Recent Tracking Events" />
                <div className="px-5 pb-5 pt-3">
                  <Timeline events={mockEvents(selected.id)} />
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center text-sm text-slate-400">Select a vehicle to view details</Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400"><Icon size={11} /> {label}</div>
      <p className="mt-0.5 text-[13px] font-semibold text-brand-950">{value}</p>
    </div>
  );
}

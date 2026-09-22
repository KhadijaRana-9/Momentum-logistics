import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Satellite, Truck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { opsApi, type Vehicle } from '@/lib/opsApi';

/**
 * Honest state: no GPS/telematics provider is configured for this project, so
 * this page does not fabricate live coordinates or movement. It shows the
 * real fleet roster and status instead — this becomes a live map the moment
 * a telematics integration (e.g. a tracker API) is actually connected.
 */
export function LiveTracking() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opsApi.vehicles.list({ limit: 200 }).then((res) => setVehicles(res.items)).finally(() => setLoading(false));
  }, []);

  const summary = {
    available: vehicles.filter((v) => v.status === 'Available').length,
    onTrip: vehicles.filter((v) => v.status === 'On Trip').length,
    maintenance: vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'Out of Service').length,
  };

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        description="Fleet status overview."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Live Tracking' }]}
      />

      <Card className="mb-5 flex items-center gap-3 border-amber-200 bg-amber-50 px-4 py-3.5">
        <Satellite size={18} className="shrink-0 text-amber-600" />
        <div>
          <p className="text-[13px] font-semibold text-amber-800">No GPS/telematics provider connected</p>
          <p className="text-xs text-amber-700">This page shows real vehicle status from the fleet roster below. A live map will appear once a tracking provider (e.g. a GPS/telematics API) is integrated — it is intentionally not simulated.</p>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Available</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{summary.available}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">On Trip</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.onTrip}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Maintenance</p><p className="mt-1 font-display text-2xl font-bold text-orange-600">{summary.maintenance}</p></Card>
      </div>

      <Card>
        <CardHeader title="Fleet Status" subtitle="Real vehicle status and current driver assignment" />
        <div className="divide-y divide-slate-100">
          {!loading && vehicles.length === 0 && <div className="p-4"><EmptyState title="No vehicles yet" description="Add vehicles under Fleet → Vehicles." /></div>}
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => navigate(`/app/fleet/vehicles/${v.id}`)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Truck size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-brand-950">{v.unitNumber} — {v.registration}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Gauge size={11} /> {v.odometer.toLocaleString()} km</span>
                  {v.driverName && <span className="flex items-center gap-1"><UserRound size={11} /> {v.driverName}</span>}
                </div>
              </div>
              <StatusBadge status={v.status} dot={false} />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

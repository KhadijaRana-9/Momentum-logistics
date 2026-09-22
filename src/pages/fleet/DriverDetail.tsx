import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, FileText, Phone, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { opsApi, type Driver, type Trip, type Expense } from '@/lib/opsApi';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DriverDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([opsApi.drivers.get(id), opsApi.trips.list({ driverId: id, limit: 100 })])
      .then(([d, t]) => { setDriver(d); setTrips(t.items); })
      .catch(() => setDriver(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    opsApi.expenses.list({ limit: 200 }).then((res) => setExpenses(res.items.filter((e) => e.driverId === id))).catch(() => {});
  }, [id]);

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading driver…</div>;

  if (!driver) {
    return (
      <div>
        <PageHeader title="Driver Not Found" breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/app/fleet/drivers' }]} />
        <Card><EmptyState title="Driver not found" /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={driver.name}
        description={`${driver.nationality ?? ''}${driver.joinDate ? ` · Joined ${formatDate(driver.joinDate)}` : ''}`}
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/app/fleet/drivers' }, { label: driver.name }]}
        actions={<StatusBadge status={driver.status} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Trips</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{trips.length}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Assigned Vehicle</p><p className="mt-1 font-display text-xl font-bold text-brand-950">{driver.assignedVehicleRef ?? '—'}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Expenses Logged</p><p className="mt-1 font-display text-2xl font-bold text-slate-700">{expenses.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              className="px-5 pt-3" value={tab} onChange={setTab}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'trips', label: 'Trip History', count: trips.length },
                { id: 'expenses', label: 'Expenses', count: expenses.length },
              ]}
            />
            {tab === 'overview' && (
              <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info icon={Phone} label="Phone" value={driver.phone ?? '—'} />
                <Info icon={FileText} label="License Number" value={driver.licenseNumber} />
                <Info icon={Calendar} label="License Expiry" value={driver.licenseExpiry ? formatDate(driver.licenseExpiry) : 'Not recorded'} />
                <Info icon={Truck} label="Home Branch" value={driver.homeBranch ?? '—'} />
                <Info icon={Calendar} label="Joined" value={driver.joinDate ? formatDate(driver.joinDate) : '—'} />
              </CardBody>
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
            {tab === 'expenses' && (
              <div className="divide-y divide-slate-100">
                {expenses.length === 0 && <div className="p-2"><EmptyState title="No expenses recorded" /></div>}
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{e.category}</p>
                      <p className="truncate text-xs text-slate-400">{e.description}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-brand-950">{formatCurrency(e.amount)}</span>
                    <StatusBadge status={e.approvalStatus} dot={false} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardBody className="flex flex-col items-center py-6 text-center">
              <Avatar name={driver.name} size="lg" color="#0b475b" />
              <p className="mt-3 text-[15px] font-semibold text-brand-950">{driver.name}</p>
              <p className="text-xs text-slate-400">{driver.nationality ?? ''}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Assigned Vehicle" />
            <CardBody>
              {driver.assignedVehicleId ? (
                <button onClick={() => navigate(`/app/fleet/vehicles/${driver.assignedVehicleId}`)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Truck size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{driver.assignedVehicleRef}</p>
                  </div>
                </button>
              ) : (
                <p className="text-xs text-slate-400">No vehicle currently assigned.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
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

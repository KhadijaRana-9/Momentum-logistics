import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Award, Calendar, FileText, Phone, Star, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDriver } from '@/data/drivers';
import { getVehicle } from '@/data/vehicles';
import { trips, tripProfit } from '@/data/trips';
import { expenseVouchers } from '@/data/expenses';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const driver = getDriver(id);

  if (!driver) {
    return (
      <div>
        <PageHeader title="Driver Not Found" breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/app/fleet/drivers' }]} />
        <Card><EmptyState title="Driver not found" /></Card>
      </div>
    );
  }

  const vehicle = getVehicle(driver.assignedVehicleId);
  const dTrips = trips.filter((t) => t.driverId === driver.id);
  const dExpenses = expenseVouchers.filter((e) => e.driverId === driver.id);
  const totalIncentives = dTrips.reduce((s, t) => s + t.incentives, 0);

  return (
    <div>
      <PageHeader
        title={driver.name}
        description={`${driver.id} · ${driver.nationality} · Joined ${formatDate(driver.joinDate)}`}
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/app/fleet/drivers' }, { label: driver.name }]}
        actions={<StatusBadge status={driver.status} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Total Trips</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{driver.totalTrips.toLocaleString()}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Rating</p><p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold text-brand-950"><Star size={18} className="fill-amber-400 text-amber-400" />{driver.rating}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Incidents</p><p className={`mt-1 font-display text-2xl font-bold ${driver.incidents > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{driver.incidents}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Incentives Earned</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatCurrency(totalIncentives)}</p></Card>
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
                { id: 'trips', label: 'Trip History', count: dTrips.length },
                { id: 'expenses', label: 'Expenses', count: dExpenses.length },
                { id: 'documents', label: 'Documents' },
              ]}
            />
            {tab === 'overview' && (
              <CardBody className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info icon={Phone} label="Phone" value={driver.phone} />
                <Info icon={FileText} label="License Number" value={driver.licenseNumber} />
                <Info icon={Calendar} label="License Expiry" value={formatDate(driver.licenseExpiry)} />
                <Info icon={Truck} label="Home Branch" value={driver.homeBranch} />
                <Info icon={Calendar} label="Joined" value={formatDate(driver.joinDate)} />
                <Info icon={Award} label="Rating" value={`${driver.rating} / 5.0`} />
              </CardBody>
            )}
            {tab === 'trips' && (
              <div className="divide-y divide-slate-100">
                {dTrips.length === 0 && <div className="p-2"><EmptyState title="No trips recorded" /></div>}
                {dTrips.map((t) => (
                  <button key={t.id} onClick={() => navigate(`/app/trips/${t.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-brand-950">{t.id} — {t.route}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.startTime, 'short')}</p>
                    </div>
                    <span className={`text-[13px] font-semibold ${tripProfit(t) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.revenue)}</span>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            )}
            {tab === 'expenses' && (
              <div className="divide-y divide-slate-100">
                {dExpenses.length === 0 && <div className="p-2"><EmptyState title="No expenses recorded" /></div>}
                {dExpenses.map((e) => (
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
            {tab === 'documents' && (
              <div className="flex flex-col gap-2 p-5">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={15} /></span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-700">Driving License</p>
                    <p className="text-xs text-slate-400">Expires {formatDate(driver.licenseExpiry)}</p>
                  </div>
                  <Button variant="ghost" size="xs">View</Button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={15} /></span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-700">Visa / Work Permit</p>
                    <p className="text-xs text-slate-400">On file</p>
                  </div>
                  <Button variant="ghost" size="xs">View</Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardBody className="flex flex-col items-center py-6 text-center">
              <Avatar name={driver.name} size="lg" color="#0b475b" />
              <p className="mt-3 text-[15px] font-semibold text-brand-950">{driver.name}</p>
              <p className="text-xs text-slate-400">{driver.nationality}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Assigned Vehicle" />
            <CardBody>
              {vehicle ? (
                <button onClick={() => navigate(`/app/fleet/vehicles/${vehicle.id}`)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Truck size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{vehicle.unitNumber}</p>
                    <p className="truncate text-xs text-slate-400">{vehicle.registration}</p>
                  </div>
                  <StatusBadge status={vehicle.status} dot={false} />
                </button>
              ) : (
                <p className="text-xs text-slate-400">No vehicle currently assigned.</p>
              )}
            </CardBody>
          </Card>

          {driver.incidents > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs font-medium text-amber-700">{driver.incidents} incident{driver.incidents > 1 ? 's' : ''} on record — reviewed by HSE Officer</p>
            </div>
          )}
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

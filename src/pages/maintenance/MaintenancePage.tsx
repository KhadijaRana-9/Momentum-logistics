import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { maintenanceOrders, maintenanceCost } from '@/data/maintenance';
import { getWorkshop } from '@/data/workshops';
import { getVehicle, vehicles } from '@/data/vehicles';
import type { MaintenanceOrder } from '@/data/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Awaiting Parts'];

export function MaintenancePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const pmDue = useMemo(() => vehicles
    .filter((v) => {
      const days = (new Date(v.nextServiceDue).getTime() - new Date('2026-08-20').getTime()) / 86400000;
      return days <= 14;
    })
    .sort((a, b) => new Date(a.nextServiceDue).getTime() - new Date(b.nextServiceDue).getTime()), []);

  const filtered = useMemo(() => maintenanceOrders.filter((m) => {
    if (status && m.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${m.id} ${m.problem} ${getVehicle(m.vehicleId)?.unitNumber}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [search, status]);

  const summary = useMemo(() => ({
    active: maintenanceOrders.filter((m) => m.status === 'In Progress' || m.status === 'Scheduled').length,
    totalCost: maintenanceOrders.reduce((s, m) => s + maintenanceCost(m), 0),
    awaitingParts: maintenanceOrders.filter((m) => m.status === 'Awaiting Parts').length,
    pmDue: pmDue.length,
  }), [pmDue]);

  const columns: Column<MaintenanceOrder>[] = [
    { key: 'id', header: 'WO #', render: (m) => <span className="font-semibold text-brand-800">{m.id}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (m) => <span className="text-slate-700">{getVehicle(m.vehicleId)?.unitNumber}</span> },
    { key: 'category', header: 'Category', render: (m) => <span className="text-slate-600">{m.category}</span> },
    { key: 'problem', header: 'Problem', render: (m) => <span className="max-w-[240px] truncate text-slate-600">{m.problem}</span> },
    { key: 'workshop', header: 'Workshop', render: (m) => <span className="text-slate-600">{getWorkshop(m.workshopId)?.name}</span> },
    { key: 'start', header: 'Start Date', accessor: (m) => m.startDate, sortable: true, render: (m) => formatDate(m.startDate, 'short') },
    { key: 'cost', header: 'Cost', align: 'right', accessor: (m) => maintenanceCost(m), sortable: true, render: (m) => <span className="font-semibold text-brand-950">{formatCurrency(maintenanceCost(m))}</span> },
    { key: 'warranty', header: 'Warranty', render: (m) => <span className="text-xs text-slate-500">{m.warranty}</span> },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Work orders, preventive maintenance schedules, and repair tracking across the fleet."
        breadcrumbs={[{ label: 'Maintenance' }]}
        actions={<>
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          <Button variant="primary" size="sm" icon={Plus}>New Work Order</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Active Work Orders</p><p className="mt-1 font-display text-2xl font-bold text-sky-600">{summary.active}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Maintenance Cost (MTD)</p><p className="mt-1 font-display text-2xl font-bold text-brand-800">{formatCurrency(summary.totalCost, { compact: true })}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Awaiting Parts</p><p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.awaitingParts}</p></Card>
        <Card className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">PM Due (14 days)</p><p className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.pmDue}</p></Card>
      </div>

      {pmDue.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Preventive Maintenance Due" subtitle="Vehicles approaching their scheduled service interval" />
          <div className="flex gap-3 overflow-x-auto px-5 pb-5">
            {pmDue.map((v) => (
              <button key={v.id} onClick={() => navigate(`/fleet/vehicles/${v.id}`)} className="flex w-56 shrink-0 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-left transition-colors hover:bg-amber-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><AlertTriangle size={16} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-brand-950">{v.unitNumber}</p>
                  <p className="text-xs text-amber-700">Due {formatDate(v.nextServiceDue, 'short')}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search WO #, vehicle, problem..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-48" />
        {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">Clear filters</button>}
      </Toolbar>

      <Card>
        <DataTable columns={columns} data={filtered} keyField={(m) => m.id} pageSize={8} />
      </Card>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Eye, Pencil, Plus, Truck, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { rrrs } from '@/data/rrr';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import type { Rrr } from '@/data/types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useSimulatedLoading } from '@/lib/useSimulatedLoading';

const STATUS_OPTIONS = ['Draft', 'Submitted', 'Approved', 'Assigned', 'Job Created', 'Dispatched', 'Completed', 'Rejected'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export function RrrList() {
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useSimulatedLoading();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [customerId, setCustomerId] = useState('');

  const filtered = useMemo(() => {
    return rrrs.filter((r) => {
      const customer = getCustomer(r.customerId);
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.id} ${customer?.name} ${r.pickup} ${r.destination} ${r.route}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status && r.status !== status) return false;
      if (priority && r.priority !== priority) return false;
      if (customerId && r.customerId !== customerId) return false;
      return true;
    });
  }, [search, status, priority, customerId]);

  const stats = useMemo(() => ({
    total: rrrs.length,
    pending: rrrs.filter((r) => r.status === 'Draft' || r.status === 'Submitted').length,
    active: rrrs.filter((r) => ['Approved', 'Assigned', 'Job Created', 'Dispatched'].includes(r.status)).length,
    completed: rrrs.filter((r) => r.status === 'Completed').length,
  }), []);

  const columns: Column<Rrr>[] = [
    { key: 'id', header: 'RRR #', accessor: (r) => r.id, sortable: true, render: (r) => <span className="font-semibold text-brand-800">{r.id}</span> },
    { key: 'date', header: 'Date', accessor: (r) => r.date, sortable: true, render: (r) => formatDate(r.date, 'short') },
    { key: 'customer', header: 'Customer', accessor: (r) => getCustomer(r.customerId)?.name ?? '', render: (r) => (
      <div>
        <p className="font-medium text-brand-950">{getCustomer(r.customerId)?.name}</p>
        <p className="text-xs text-slate-400">{getCustomer(r.customerId)?.city}</p>
      </div>
    ) },
    { key: 'route', header: 'Pickup → Destination', render: (r) => (
      <div className="max-w-[220px]">
        <p className="truncate text-[13px] text-slate-700">{r.pickup}</p>
        <p className="truncate text-xs text-slate-400">→ {r.destination}</p>
      </div>
    ) },
    { key: 'vehicleType', header: 'Vehicle Type', accessor: (r) => r.vehicleType, render: (r) => <span className="text-slate-600">{r.vehicleType}</span> },
    { key: 'requiredDate', header: 'Required', accessor: (r) => r.requiredDate, sortable: true, render: (r) => formatDate(r.requiredDate, 'short') },
    { key: 'priority', header: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'assigned', header: 'Assigned', render: (r) => {
      const v = getVehicle(r.assignedVehicleId);
      const d = getDriver(r.assignedDriverId);
      if (!v) return <span className="text-xs text-slate-400">Unassigned</span>;
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Truck size={13} className="text-slate-400" />
          {v.unitNumber} {d && <span className="text-slate-400">· {d.name.split(' ')[0]}</span>}
        </div>
      );
    } },
    { key: 'actions', header: '', align: 'right', width: '56px', render: (r) => (
      <Dropdown
        items={[
          { label: 'View Details', icon: <Eye size={14} />, onClick: () => navigate(`/rrr/${r.id}`) },
          { label: 'Edit RRR', icon: <Pencil size={14} />, onClick: () => toast({ type: 'info', title: 'Edit RRR', description: `Editing ${r.id}` }) },
          { label: 'Duplicate', divider: true },
          { label: 'Cancel Request', icon: <XCircle size={14} />, danger: true, onClick: () => toast({ type: 'warning', title: 'Request cancelled', description: `${r.id} marked as cancelled` }) },
        ]}
      />
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="RRR — Requisition Requests"
        description="Manage transport requisitions from customer request through approval and assignment."
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR' }]}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/rrr/new')}>New RRR</Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total RRRs', value: stats.total, tone: 'text-brand-800' },
          { label: 'Pending Action', value: stats.pending, tone: 'text-amber-600' },
          { label: 'In Progress', value: stats.active, tone: 'text-sky-600' },
          { label: 'Completed', value: stats.completed, tone: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <Card className="px-4 py-3.5">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search RRR #, customer, route..." className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Statuses" className="sm:w-44" />
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={PRIORITY_OPTIONS.map((s) => ({ label: s, value: s }))} placeholder="All Priorities" className="sm:w-40" />
        <Select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          options={Array.from(new Set(rrrs.map((r) => r.customerId))).map((id) => ({ label: getCustomer(id)?.name ?? id, value: id }))}
          placeholder="All Customers"
          className="sm:w-52"
        />
        {(search || status || priority || customerId) && (
          <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setCustomerId(''); }} className="text-xs font-medium text-slate-500 hover:text-brand-700 sm:ml-auto">
            Clear filters
          </button>
        )}
      </Toolbar>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          keyField={(r) => r.id}
          onRowClick={(r) => navigate(`/rrr/${r.id}`)}
          loading={loading}
          pageSize={8}
          emptyTitle="No RRRs match your filters"
          emptyDescription="Try adjusting your search or clearing filters to see more requests."
        />
      </Card>
    </div>
  );
}

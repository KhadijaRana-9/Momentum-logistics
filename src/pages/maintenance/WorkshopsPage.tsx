import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone, Plus, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { opsApi, type Workshop, type MaintenanceOrder } from '@/lib/opsApi';

export function WorkshopsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([opsApi.workshops.list(), opsApi.maintenance.list({ limit: 500 })])
      .then(([w, m]) => { setWorkshops(w.items); setOrders(m.items); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      await opsApi.workshops.create(body);
      toast({ type: 'success', title: 'Workshop added' });
      setShowNew(false);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Could not add workshop', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Workshops"
        description="Internal and external workshop network for fleet servicing and repairs."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Workshops' }]}
        actions={can('maintenance:manage') ? <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>Add Workshop</Button> : undefined}
      />

      {!loading && workshops.length === 0 && <Card><EmptyState title="No workshops yet" description="Add your first workshop to start logging work orders." /></Card>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workshops.map((w, i) => {
          const wOrders = orders.filter((o) => o.workshopId === w.id);
          const active = wOrders.filter((o) => o.status !== 'Completed').length;
          return (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <Card hoverable className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Wrench size={20} /></span>
                  <Badge tone={w.type === 'Internal' ? 'brand' : 'neutral'}>{w.type}</Badge>
                </div>
                <h3 className="font-display text-[15px] font-semibold text-brand-950">{w.name}</h3>
                {w.city && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Building2 size={12} /> {w.city}</p>}
                {w.contact && <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} /> {w.contact}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(w.specialties ?? []).map((s) => (
                    <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">{s}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">{wOrders.length} work order{wOrders.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-semibold text-brand-800">{active} active</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New workshop" size="sm">
        <form id="new-workshop-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" required><Input name="name" required /></Field>
          <Field label="City"><Input name="city" /></Field>
          <Field label="Contact"><Input name="contact" /></Field>
          <Field label="Specialties (comma-separated)"><Input name="specialties" placeholder="Engine Overhaul, Brakes" /></Field>
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button form="new-workshop-form" type="submit" loading={submitting}>Add workshop</Button>
        </div>
      </Modal>
    </div>
  );
}

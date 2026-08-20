import { motion } from 'framer-motion';
import { Building2, Phone, Plus, Star, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { workshops } from '@/data/workshops';
import { maintenanceOrders } from '@/data/maintenance';

export function WorkshopsPage() {
  return (
    <div>
      <PageHeader
        title="Workshops"
        description="Internal and external workshop network for fleet servicing and repairs."
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Workshops' }]}
        actions={<Button variant="primary" size="sm" icon={Plus}>Add Workshop</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workshops.map((w, i) => {
          const orders = maintenanceOrders.filter((m) => m.workshopId === w.id);
          return (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <Card hoverable className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Wrench size={20} /></span>
                  <Badge tone={w.type === 'Internal' ? 'brand' : 'neutral'}>{w.type}</Badge>
                </div>
                <h3 className="font-display text-[15px] font-semibold text-brand-950">{w.name}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Building2 size={12} /> {w.city}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} /> {w.contact}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {w.specialties.map((s) => (
                    <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">{s}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><Star size={12} className="fill-amber-400 text-amber-400" /> {w.rating}</span>
                  <span className="text-xs text-slate-500">{orders.length} work order{orders.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-semibold text-brand-800">{w.activeJobs} active</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

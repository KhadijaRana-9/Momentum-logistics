import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Truck, UserRound } from 'lucide-react';
import { JOB_STATUSES, type Job } from '@/lib/opsApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getStatusTone, TONE_CLASSES } from '@/design/status';

/**
 * Read-only board grouped by real Job status. Earlier versions let you drag a
 * card to any column to fake a status change client-side — the real backend
 * enforces a validated workflow (vehicle+driver assignment, then a dedicated
 * Dispatch action that creates a Trip), so free drag-to-any-column was
 * removed rather than left as a non-functional gesture. Use Dispatch Center
 * to actually assign or dispatch a job.
 */
export function JobBoardView({ jobs }: { jobs: Job[] }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {JOB_STATUSES.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col);
        const tone = TONE_CLASSES[getStatusTone(col)];
        return (
          <div key={col} className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', tone.dot)} />
                <span className="text-[13px] font-semibold text-brand-950">{col}</span>
              </div>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">{colJobs.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2.5 pb-3">
              {colJobs.map((job) => (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => navigate(job.tripId ? `/app/trips/${job.tripId}` : '/app/dispatch')}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-card-hover"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-brand-800">{job.ref}</span>
                  </div>
                  <p className="mb-2 truncate text-[13px] font-medium text-brand-950">{job.customerName}</p>
                  <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{job.pickup} → {job.destination}</span>
                  </div>
                  {(job.vehicleRef || job.driverName) && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {job.vehicleRef && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                          <Truck size={10} /> {job.vehicleRef}
                        </span>
                      )}
                      {job.driverName && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                          <UserRound size={10} /> {job.driverName.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[10.5px] text-slate-400">{formatDate(job.scheduledDate, 'short')}</span>
                    <span className="text-[12px] font-semibold text-brand-950">{formatCurrency(job.revenue, { compact: true })}</span>
                  </div>
                </motion.div>
              ))}
              {colJobs.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                  None
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

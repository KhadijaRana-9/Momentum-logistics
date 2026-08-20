import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GripVertical, MapPin, Truck, UserRound } from 'lucide-react';
import { JOB_BOARD_COLUMNS } from '@/data/jobs';
import { getCustomer } from '@/data/customers';
import { getVehicle } from '@/data/vehicles';
import { getDriver } from '@/data/drivers';
import type { Job, JobStatus } from '@/data/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getStatusTone, TONE_CLASSES } from '@/design/status';

interface JobBoardViewProps {
  jobs: Job[];
  onMove: (jobId: string, status: JobStatus) => void;
}

export function JobBoardView({ jobs: initialJobs, onMove }: JobBoardViewProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<JobStatus | null>(null);
  const navigate = useNavigate();

  function handleDrop(status: JobStatus) {
    if (!dragId) return;
    setJobs((prev) => prev.map((j) => (j.id === dragId ? { ...j, status } : j)));
    onMove(dragId, status);
    setDragId(null);
    setOverColumn(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {JOB_BOARD_COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col);
        const tone = TONE_CLASSES[getStatusTone(col)];
        return (
          <div
            key={col}
            onDragOver={(e) => { e.preventDefault(); setOverColumn(col); }}
            onDragLeave={() => setOverColumn((c) => (c === col ? null : c))}
            onDrop={() => handleDrop(col)}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50/60 transition-colors',
              overColumn === col ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200',
            )}
          >
            <div className="flex items-center justify-between px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', tone.dot)} />
                <span className="text-[13px] font-semibold text-brand-950">{col}</span>
              </div>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">{colJobs.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2.5 pb-3">
              <AnimatePresence>
                {colJobs.map((job) => {
                  const customer = getCustomer(job.customerId);
                  const vehicle = getVehicle(job.vehicleId);
                  const driver = getDriver(job.driverId);
                  return (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      draggable
                      onDragStart={() => setDragId(job.id)}
                      onDragEnd={() => { setDragId(null); setOverColumn(null); }}
                      onClick={() => navigate(job.tripId ? `/trips/${job.tripId}` : '/jobs')}
                      className={cn(
                        'cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-card-hover active:cursor-grabbing',
                        dragId === job.id && 'opacity-40',
                      )}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[12.5px] font-semibold text-brand-800">{job.id}</span>
                        <GripVertical size={13} className="text-slate-300" />
                      </div>
                      <p className="mb-2 truncate text-[13px] font-medium text-brand-950">{customer?.name}</p>
                      <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{job.route}</span>
                      </div>
                      {(vehicle || driver) && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {vehicle && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                              <Truck size={10} /> {vehicle.unitNumber}
                            </span>
                          )}
                          {driver && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                              <UserRound size={10} /> {driver.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-[10.5px] text-slate-400">{formatDate(job.scheduledDate, 'short')}</span>
                        <span className="text-[12px] font-semibold text-brand-950">{formatCurrency(job.revenue, { compact: true })}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {colJobs.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

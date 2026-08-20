import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkflowStepperProps {
  stages: readonly string[];
  current: string;
  rejected?: boolean;
}

export function WorkflowStepper({ stages, current, rejected }: WorkflowStepperProps) {
  const currentIdx = stages.indexOf(current);

  return (
    <div className="flex items-center overflow-x-auto py-1 no-scrollbar">
      {stages.map((stage, i) => {
        const isDone = i < currentIdx || (i === currentIdx && !rejected);
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        return (
          <div key={stage} className="flex items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-offset-2',
                  isCurrent && !rejected && 'bg-brand-800 text-white ring-brand-800',
                  isCurrent && rejected && 'bg-rose-600 text-white ring-rose-600',
                  isDone && !isCurrent && 'bg-emerald-500 text-white ring-emerald-500',
                  isFuture && 'bg-slate-100 text-slate-400 ring-slate-200',
                )}
              >
                {isDone && !isCurrent ? <Check size={13} strokeWidth={3} /> : i + 1}
              </motion.div>
              <span className={cn('whitespace-nowrap text-[11px] font-medium', isFuture ? 'text-slate-400' : 'text-slate-700')}>{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={cn('mx-1.5 mb-4 h-0.5 w-8 shrink-0 rounded-full sm:w-14', i < currentIdx ? 'bg-emerald-400' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

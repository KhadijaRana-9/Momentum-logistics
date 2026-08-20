import type { LucideIcon } from 'lucide-react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

export interface TimelineEvent {
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
}

const toneClasses = {
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-100 text-slate-500',
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((e, i) => {
        const Icon = e.icon ?? Circle;
        const isLast = i === events.length - 1;
        return (
          <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <div className="absolute left-[13px] top-7 h-full w-px bg-slate-200" />}
            <span className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', toneClasses[e.tone ?? 'neutral'])}>
              <Icon size={13} strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-brand-950">{e.title}</p>
                <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(e.timestamp)}</span>
              </div>
              {e.description && <p className="mt-0.5 text-xs text-slate-500">{e.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

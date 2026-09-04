import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-card backdrop-blur-sm sm:flex-row sm:items-center', className)}>
      {children}
    </div>
  );
}

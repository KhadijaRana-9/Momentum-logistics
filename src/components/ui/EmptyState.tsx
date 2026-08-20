import type { LucideIcon } from 'lucide-react';
import { Inbox, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'search' | 'error';
}

export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const Icon = icon ?? (variant === 'search' ? SearchX : Inbox);
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon size={24} className="text-slate-400" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[15px] font-semibold text-brand-950">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

import { type Tone, TONE_CLASSES, getStatusTone } from '@/design/status';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, tone, dot = true, className }: StatusBadgeProps) {
  const t = tone ?? getStatusTone(status);
  const c = TONE_CLASSES[t];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        c.bg, c.text, c.ring, className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />}
      {status}
    </span>
  );
}

export function Badge({ children, className, tone = 'neutral' }: { children: React.ReactNode; className?: string; tone?: Tone }) {
  const c = TONE_CLASSES[tone];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', c.bg, c.text, c.ring, className)}>
      {children}
    </span>
  );
}

const PRIORITY_TONE: Record<string, Tone> = {
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
  Urgent: 'danger',
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const tone = PRIORITY_TONE[priority] ?? 'neutral';
  const c = TONE_CLASSES[tone];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', c.text, className)}>
      {priority === 'Urgent' && <span className="relative flex h-1.5 w-1.5"><span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', c.dot)} /><span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', c.dot)} /></span>}
      {priority !== 'Urgent' && <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />}
      {priority}
    </span>
  );
}

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeadTemperature } from '../types';

const TEMP_STYLES: Record<LeadTemperature, string> = {
  Hot: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  Warm: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  Cold: 'bg-sky-50 text-sky-700 ring-sky-600/15',
};

export function LeadTemperatureBadge({ temperature, score }: { temperature: LeadTemperature; score?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', TEMP_STYLES[temperature])}>
      {temperature === 'Hot' && <Flame size={11} />}
      {temperature}
      {typeof score === 'number' && <span className="opacity-60">· {score}</span>}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const tone = score >= 70 ? 'bg-rose-500' : score >= 40 ? 'bg-orange-400' : 'bg-sky-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{score}</span>
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from './AnimatedNumber';

interface KpiCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number;
  trend?: 'up' | 'down';
  trendGood?: 'up' | 'down';
  period?: string;
  icon: LucideIcon;
  accent?: string;
  index?: number;
}

export function KpiCard({ label, value, format, delta, trend, trendGood = 'up', period, icon: Icon, accent = 'brand', index = 0 }: KpiCardProps) {
  const isGood = trend === trendGood;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
    >
      <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] transition-transform duration-300 group-hover:scale-110', `bg-${accent}-600`)} style={{ background: accentColor(accent) }} />
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accentBg(accent))}>
          <Icon size={16} strokeWidth={2.2} className={accentText(accent)} />
        </span>
      </div>
      <div className="mt-3 font-display text-[26px] font-bold tracking-tight text-brand-950">
        <AnimatedNumber value={value} format={format} />
      </div>
      {(delta !== undefined || period) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {delta !== undefined && (
            <span className={cn('inline-flex items-center gap-0.5 font-semibold', isGood ? 'text-emerald-600' : 'text-rose-600')}>
              {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(delta)}%
            </span>
          )}
          {period && <span className="text-slate-400">{period}</span>}
        </div>
      )}
    </motion.div>
  );
}

function accentColor(accent: string) {
  const map: Record<string, string> = {
    brand: '#003848', sky: '#0284c7', emerald: '#008838', amber: '#d97706', rose: '#e11d48', teal: '#007080',
  };
  return map[accent] ?? map.brand;
}
function accentBg(accent: string) {
  const map: Record<string, string> = {
    brand: 'bg-brand-50', sky: 'bg-sky-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', rose: 'bg-rose-50', teal: 'bg-teal-50',
  };
  return map[accent] ?? map.brand;
}
function accentText(accent: string) {
  const map: Record<string, string> = {
    brand: 'text-brand-700', sky: 'text-sky-600', emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600', teal: 'text-teal-600',
  };
  return map[accent] ?? map.brand;
}

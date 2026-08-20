import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;

  function select(id: string) {
    setInternal(id);
    onChange?.(id);
  }

  return (
    <div className={cn('flex items-center gap-1 border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => select(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors duration-150',
              isActive ? 'text-brand-800' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-semibold', isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500')}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div layoutId="tabs-underline" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-700" transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

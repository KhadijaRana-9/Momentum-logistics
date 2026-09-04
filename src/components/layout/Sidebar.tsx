import { NavLink } from 'react-router-dom';
import { ChevronsLeft, Compass } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { navSections } from './navConfig';
import { unreadAlertCount } from '@/data/alerts';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const alertCount = unreadAlertCount();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 252 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 flex h-screen shrink-0 flex-col overflow-hidden border-r border-brand-950 bg-gradient-to-b from-brand-950 via-brand-950 to-[#062a38] text-slate-300 shadow-[10px_0_30px_-24px_rgba(2,32,44,0.7)]"
    >
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl" />

      <div className={cn('relative z-10 flex h-16 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-950/30 ring-1 ring-white/15">
          <Compass size={17} className="text-white" strokeWidth={2.2} />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.16 }} className="min-w-0 leading-tight">
              <p className="truncate font-display text-[13.5px] font-bold tracking-tight text-white">Momentum</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-brand-300">Logistics ERP</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1 mt-4 first:mt-2">
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-400/80">{section.label}</p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app' || item.to === '/app/crm'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-[background-color,color,transform] duration-200 ease-out',
                      collapsed && 'justify-center px-0 py-2.5',
                      isActive ? 'bg-white/[0.12] text-white ring-1 ring-inset ring-white/[0.05]' : 'text-slate-300 hover:translate-x-0.5 hover:bg-white/[0.06] hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.75)]" transition={{ duration: 0.2 }} />
                      )}
                      <item.icon size={17} strokeWidth={2} className={cn('shrink-0', isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.label === 'Alerts' && alertCount > 0 && (
                        <span className="ml-auto flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{alertCount}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className={cn('relative z-10 flex h-12 shrink-0 items-center gap-2 border-t border-white/[0.08] px-4 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white', collapsed && 'justify-center px-0')}
      >
        <ChevronsLeft size={16} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && 'Collapse'}
      </button>
    </motion.aside>
  );
}

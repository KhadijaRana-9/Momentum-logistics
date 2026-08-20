import { NavLink } from 'react-router-dom';
import { ChevronsLeft, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
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
      className="relative z-20 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-brand-950 text-slate-300"
    >
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 shadow-xs">
          <Compass size={17} className="text-white" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[13.5px] font-bold text-white">Momentum</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-brand-300">Logistics ERP</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
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
                  end={item.to === '/'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150',
                      collapsed && 'justify-center px-0 py-2.5',
                      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400" transition={{ duration: 0.2 }} />
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
        className={cn('flex h-12 shrink-0 items-center gap-2 border-t border-white/10 px-4 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}
      >
        <ChevronsLeft size={16} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && 'Collapse'}
      </button>
    </motion.aside>
  );
}

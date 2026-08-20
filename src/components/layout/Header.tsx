import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, ChevronDown, LogOut, Plus, Search, Settings, UserCircle } from 'lucide-react';
import { alerts as allAlerts, unreadAlertCount } from '@/data/alerts';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';
import { GlobalSearch } from './GlobalSearch';

const QUICK_ACTIONS = [
  { label: 'New RRR', to: '/rrr/new' },
  { label: 'New Job', to: '/jobs' },
  { label: 'New Trip Sheet', to: '/trips' },
  { label: 'New Fuel Voucher', to: '/finance/fuel' },
  { label: 'New Expense Voucher', to: '/finance/expenses' },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const unread = unreadAlertCount();
  const recentAlerts = allAlerts.slice(0, 6);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 transition-colors hover:border-slate-300 hover:bg-white"
      >
        <Search size={15} />
        <span className="text-[13px]">Search RRR, jobs, trips, vehicles...</span>
        <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="mr-2 hidden items-center gap-1.5 text-xs text-slate-500 xl:flex">
          <Calendar size={14} />
          {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}
          <span className="mx-1 text-slate-300">•</span>
          {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(now)}
        </div>

        <div className="relative">
          <button
            onClick={() => setQuickOpen((o) => !o)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-800 px-3 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-brand-900"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New</span>
            <ChevronDown size={13} className={cn('transition-transform', quickOpen && 'rotate-180')} />
          </button>
          <Menu open={quickOpen} onClose={() => setQuickOpen(false)}>
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => { navigate(a.to); setQuickOpen(false); }}
                className="flex w-full items-center px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
              >
                {a.label}
              </button>
            ))}
          </Menu>
        </div>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            <Bell size={17} />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
          </button>
          <Menu open={notifOpen} onClose={() => setNotifOpen(false)} width="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[13px] font-semibold text-brand-950">Notifications</p>
              <button onClick={() => { navigate('/alerts'); setNotifOpen(false); }} className="text-xs font-medium text-brand-700 hover:underline">View all</button>
            </div>
            <div className="max-h-80 overflow-y-auto border-t border-slate-100">
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex gap-2.5 border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-slate-50">
                  <StatusBadge status={a.severity} dot={false} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-brand-950">{a.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-500">{a.description}</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Menu>
        </div>

        <div className="relative">
          <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100">
            <Avatar name="Hassan Al Zaabi" color="#0b475b" size="sm" />
            <div className="hidden text-left leading-tight xl:block">
              <p className="text-[12.5px] font-semibold text-brand-950">Hassan Al Zaabi</p>
              <p className="text-[11px] text-slate-400">Operations Director</p>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          <Menu open={profileOpen} onClose={() => setProfileOpen(false)} width="w-56">
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="text-[13px] font-semibold text-brand-950">Hassan Al Zaabi</p>
              <p className="text-xs text-slate-400">{formatDateTime(now.toISOString())} local time</p>
            </div>
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">
              <UserCircle size={15} /> My Profile
            </button>
            <button onClick={() => { navigate('/admin/settings'); setProfileOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">
              <Settings size={15} /> Settings
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50">
              <LogOut size={15} /> Sign out
            </button>
          </Menu>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

function Menu({ open, onClose, children, width = 'w-56' }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    function onClick() { onClose(); }
    const t = setTimeout(() => document.addEventListener('click', onClick), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', onClick); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className={cn('absolute right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-popover', width)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

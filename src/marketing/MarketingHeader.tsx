import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { track } from '@/lib/tracking';

const NAV = [
  { label: 'ERP Suite', to: '/solutions/erp' },
  { label: 'FBR Invoicing', to: '/solutions/fbr-invoicing' },
  { label: 'Cloud & AI', to: '/solutions/cloud-ai' },
  { label: 'Contact', to: '/contact' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function goDemo() {
    track('cta_click', { location: 'header', target: 'request_demo' });
    navigate('/request-demo');
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <LogoMark size={30} />
          <span className="font-display text-[15px] font-bold tracking-tight text-brand-950">
            Momentum <span className="font-medium text-brand-600">Logistics</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors',
                  isActive ? 'text-brand-800' : 'text-slate-600 hover:text-brand-800',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link to="/app" className="px-3 py-2 text-[13.5px] font-medium text-slate-600 hover:text-brand-800">
            Client Login
          </Link>
          <Button size="sm" onClick={goDemo}>Request a Demo</Button>
        </div>

        <button
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-2.5 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700')
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/app" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700">
              Client Login
            </Link>
            <Button size="sm" className="mt-2" onClick={goDemo}>Request a Demo</Button>
          </nav>
        </div>
      )}
    </header>
  );
}

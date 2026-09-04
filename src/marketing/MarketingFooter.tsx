import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';

const COLUMNS = [
  {
    title: 'Solutions',
    links: [
      { label: 'ERP Suite', to: '/solutions/erp' },
      { label: 'FBR-Linked Invoicing', to: '/solutions/fbr-invoicing' },
      { label: 'Cloud & AI', to: '/solutions/cloud-ai' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Request a Demo', to: '/request-demo' },
      { label: 'Client Login', to: '/app' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-display text-[15px] font-bold tracking-tight text-brand-950">Momentum Logistics</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Enterprise software solutions for Pakistani businesses — ERP suites, FBR-integrated
            invoicing, and cloud &amp; AI systems built for manufacturing, distribution and retail.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-600 hover:text-brand-800">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Momentum Logistics. All rights reserved.</p>
          <p>ERP solutions Pakistan &middot; FBR invoicing software &middot; Cloud &amp; AI</p>
        </div>
      </div>
    </footer>
  );
}

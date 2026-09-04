import { useState } from 'react';
import { useHead } from '@/lib/useHead';
import { LeadForm } from '../components/LeadForm';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'contact', label: 'General enquiry', variant: 'contact' as const },
  { id: 'consultation', label: 'Software consultation', variant: 'software_consultation' as const },
  { id: 'quote', label: 'Request a quote', variant: 'quote_request' as const },
];

export function ContactPage() {
  const [tab, setTab] = useState(TABS[0]);

  useHead({
    title: 'Contact Momentum Logistics',
    description:
      'Get in touch with Momentum Logistics about ERP software, FBR invoicing, cloud & AI solutions, or a custom software consultation.',
    path: '/contact',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-brand-950">Contact us</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
        Whichever route fits your enquiry — every message reaches the same team and is tracked end to end.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
              tab.id === t.id ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <LeadForm key={tab.id} variant={tab.variant} />
      </div>
    </div>
  );
}

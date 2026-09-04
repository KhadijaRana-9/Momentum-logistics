import { useHead } from '@/lib/useHead';
import { LeadForm } from '../components/LeadForm';
import { CheckList } from '../components/sections';

export function RequestDemoPage() {
  useHead({
    title: 'Request a Demo | Momentum Logistics',
    description:
      'Book a tailored demo of Momentum Logistics ERP, FBR-linked invoicing, or cloud & AI solutions. See the platform on scenarios relevant to your business.',
    path: '/request-demo',
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-950">Request a demo</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Tell us a little about your business and what you want to see. We&apos;ll set up a walkthrough
            with the right specialist — usually within one business day.
          </p>
          <div className="mt-6">
            <CheckList
              className="sm:grid-cols-1"
              items={[
                'A session tailored to your industry and processes',
                'Straight answers on fit, timeline and approach',
                'No pressure — bring your team and your questions',
              ]}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <LeadForm variant="demo" />
        </div>
      </div>
    </div>
  );
}

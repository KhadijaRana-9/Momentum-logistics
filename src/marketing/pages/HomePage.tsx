import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Cloud, ReceiptText } from 'lucide-react';
import { useHead } from '@/lib/useHead';
import { config } from '@/lib/config';
import { track } from '@/lib/tracking';
import { Section, SectionHeading, CtaBand, TrustNote } from '../components/sections';

const SOLUTIONS = [
  {
    icon: Boxes,
    title: 'ERP Suite',
    to: '/solutions/erp',
    body: 'Finance, inventory, procurement, sales and production unified in one platform.',
  },
  {
    icon: ReceiptText,
    title: 'FBR-Linked Invoicing',
    to: '/solutions/fbr-invoicing',
    body: 'Compliant tax invoicing and POS integration, standalone or inside the ERP.',
  },
  {
    icon: Cloud,
    title: 'Cloud & AI',
    to: '/solutions/cloud-ai',
    body: 'Cloud migration, managed hosting and practical AI automation with real ROI.',
  },
];

export function HomePage() {
  useHead({
    title: 'Momentum Logistics — ERP, FBR Invoicing & Cloud Solutions in Pakistan',
    description:
      'Momentum Logistics builds enterprise software for Pakistani businesses: integrated ERP suites, FBR-linked invoicing, and cloud & AI solutions for manufacturing, distribution and retail.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Momentum Logistics',
      url: config.siteUrl,
      description: 'Enterprise software solutions — ERP, FBR-linked invoicing, and cloud & AI — for businesses in Pakistan.',
    },
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Enterprise Software Solutions</p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-brand-950 sm:text-4xl lg:text-[2.75rem]">
              Software that runs the core of your business
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              Momentum Logistics helps businesses across Pakistan replace disconnected spreadsheets and
              legacy tools with integrated ERP, FBR-compliant invoicing, and cloud &amp; AI systems —
              built for manufacturing, distribution and retail.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/request-demo"
                onClick={() => track('cta_click', { location: 'hero', target: 'request_demo' })}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-5 text-[15px] font-medium text-white shadow-xs transition-transform hover:-translate-y-px hover:bg-brand-900"
              >
                Request a Demo <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex h-11 items-center rounded-lg border border-brand-200 px-5 text-[15px] font-medium text-brand-800 hover:bg-brand-50"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Solutions" title="Three platforms, one connected system" />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <s.icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-[16px] font-semibold text-brand-950">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{s.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700">
                Learn more <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <SectionHeading
            eyebrow="Why Momentum"
            title="Built for how businesses in Pakistan actually operate"
            intro="Multi-branch structures, FBR compliance, credit customers, imports and landed cost — handled as first-class concerns, not afterthoughts."
          />
          <div className="mt-6"><TrustNote /></div>
        </div>
      </Section>

      <CtaBand
        heading="See the platform on your data"
        sub="Book a tailored walkthrough with our team — no obligation."
      />
    </>
  );
}

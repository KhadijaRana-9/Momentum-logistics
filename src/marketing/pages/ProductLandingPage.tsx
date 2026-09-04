import { Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useHead } from '@/lib/useHead';
import { config } from '@/lib/config';
import { track } from '@/lib/tracking';
import { LANDING_PAGES } from '../content';
import { LeadForm } from '../components/LeadForm';
import { Section, SectionHeading, CheckList, BenefitGrid, FaqList, CtaBand, TrustNote } from '../components/sections';

export function ProductLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? LANDING_PAGES[slug] : undefined;

  useEffect(() => {
    if (content) track('product_view', { product: content.product, slug: content.slug });
  }, [content]);

  useHead({
    title: content?.seo.title ?? 'Solutions | Momentum Logistics',
    description: content?.seo.description,
    path: content ? `/solutions/${content.slug}` : undefined,
    jsonLd: content
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `Momentum ${content.product}`,
          description: content.seo.description,
          brand: { '@type': 'Brand', name: 'Momentum Logistics' },
          url: `${config.siteUrl}/solutions/${content.slug}`,
        }
      : undefined,
  });

  if (!content) return <Navigate to="/" replace />;

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">{content.hero.eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-brand-950 sm:text-4xl">
              {content.hero.heading}
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-slate-600">{content.hero.subheading}</p>
            <div className="mt-6">
              <CheckList items={content.valueProps} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <LeadForm
              variant={content.formVariant}
              product={content.product}
              heading={content.hero.primaryCta}
              compact
            />
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Benefits" title="What changes when you run on Momentum" />
        <div className="mt-8"><BenefitGrid benefits={content.benefits} /></div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="Capabilities" />
            <div className="mt-5"><CheckList items={content.features} /></div>
          </div>
          <div>
            <SectionHeading title="Common use cases" />
            <ul className="mt-5 space-y-3">
              {content.useCases.map((uc) => (
                <li key={uc} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13.5px] text-slate-700">{uc}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="Industries" title="Who we build for" />
        <div className="mt-5 flex flex-wrap gap-2">
          {content.industries.map((ind) => (
            <span key={ind} className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[13px] font-medium text-slate-700">{ind}</span>
          ))}
        </div>
        <div className="mt-8 max-w-2xl"><TrustNote /></div>
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="FAQ" title="Questions we hear often" />
        <div className="mt-6 max-w-3xl"><FaqList items={content.faq} /></div>
      </Section>

      <CtaBand heading={`Ready to see ${content.product} in action?`} sub="Book a walkthrough tailored to your business." />
    </>
  );
}

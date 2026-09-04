import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8', className)}>
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{title}</h2>
      {intro && <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{intro}</p>}
    </div>
  );
}

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('grid gap-2.5 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[14px] text-slate-700">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={11} strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function BenefitGrid({ benefits }: { benefits: { title: string; body: string }[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {benefits.map((b) => (
        <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-[15px] font-semibold text-brand-950">{b.title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{b.body}</p>
        </div>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.map((item) => (
        <div key={item.q} className="p-5">
          <dt className="font-display text-[14.5px] font-semibold text-brand-950">{item.q}</dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CtaBand({ heading, sub, to = '/request-demo', label = 'Request a Demo' }: { heading: string; sub?: string; to?: string; label?: string }) {
  return (
    <div className="bg-brand-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{heading}</h2>
          {sub && <p className="mt-1.5 text-[14px] text-brand-200">{sub}</p>}
        </div>
        <Link
          to={to}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-white px-5 text-[15px] font-medium text-brand-900 shadow-xs transition-transform hover:-translate-y-px hover:bg-slate-50"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}

export function TrustNote() {
  return (
    <p className="text-[13px] text-slate-500">
      Momentum Logistics builds enterprise software for businesses across Pakistan. Customer names,
      case studies and metrics are added here only once clients approve them — this section is
      structured for that content, not filled with placeholders.
    </p>
  );
}

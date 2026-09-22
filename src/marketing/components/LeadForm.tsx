import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { api, ApiError } from '@/lib/apiClient';
import { getAttribution } from '@/lib/attribution';
import { track } from '@/lib/tracking';

type Variant = 'demo' | 'erp_demo' | 'software_consultation' | 'fbr_inquiry' | 'cloud_ai_inquiry' | 'contact' | 'quote_request';

interface LeadFormProps {
  variant?: Variant;
  product?: 'ERP Suite' | 'FBR Invoicing' | 'Cloud & AI' | 'Custom Software';
  heading?: string;
  compact?: boolean;
  onSuccess?: (ref: string) => void;
}

const PRODUCT_OPTIONS = [
  { label: 'ERP Suite', value: 'ERP Suite' },
  { label: 'FBR-Linked Invoicing', value: 'FBR Invoicing' },
  { label: 'Cloud & AI Solutions', value: 'Cloud & AI' },
  { label: 'Custom Software', value: 'Custom Software' },
  { label: 'Not sure yet', value: 'Unspecified' },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'].map((v) => ({ label: `${v} employees`, value: v }));
const TIMELINES = ['Immediately', 'This quarter', '1-3 months', '3-6 months', '6+ months', 'Just researching'].map((v) => ({ label: v, value: v }));

const TRACK_EVENT: Record<Variant, Parameters<typeof track>[0]> = {
  demo: 'demo_request',
  erp_demo: 'demo_request',
  software_consultation: 'consultation_request',
  fbr_inquiry: 'consultation_request',
  cloud_ai_inquiry: 'consultation_request',
  contact: 'contact_submit',
  quote_request: 'quote_request',
};

export function LeadForm({ variant = 'demo', product, heading, compact, onSuccess }: LeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const isDemo = variant === 'demo' || variant === 'erp_demo';
  const showProblem = variant === 'software_consultation';
  const showFbr = variant === 'fbr_inquiry';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    const attr = getAttribution();
    Object.assign(payload, {
      utmSource: attr.utmSource,
      utmMedium: attr.utmMedium,
      utmCampaign: attr.utmCampaign,
      utmTerm: attr.utmTerm,
      utmContent: attr.utmContent,
      gclid: attr.gclid,
      fbclid: attr.fbclid,
      referrer: attr.referrer,
      landingPage: attr.landingPage,
    });
    if (product && !payload.product) payload.product = product;

    try {
      payload.type = variant === 'demo' ? 'demo_request' : variant;

      const res = await api.post<{ ref: string; deduplicated: boolean }>('/inquiries', payload);
      track(TRACK_EVENT[variant], { product: payload.product, deduplicated: res.deduplicated });
      track('lead_created', { source: 'form', variant });
      setSuccessRef(res.ref);
      onSuccess?.(res.ref);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        setFormError('Please correct the highlighted fields.');
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (successRef) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
        <h3 className="mt-3 font-display text-lg font-semibold text-brand-950">Request received</h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Reference <span className="font-mono font-semibold text-brand-800">{successRef}</span>. Our team will
          reach out within one business day to arrange the next step.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {heading && <h3 className="font-display text-lg font-semibold text-brand-950">{heading}</h3>}
      {formError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{formError}</p>
      )}

      {/* Honeypot — hidden from users, catches bots */}
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label="Full name" required error={errors.name}>
          <Input name="name" autoComplete="name" error={!!errors.name} required />
        </Field>
        <Field label="Work email" required error={errors.email}>
          <Input name="email" type="email" autoComplete="email" error={!!errors.email} required />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input name="phone" type="tel" autoComplete="tel" error={!!errors.phone} />
        </Field>
        <Field label="Company" error={errors.company}>
          <Input name="company" autoComplete="organization" error={!!errors.company} />
        </Field>
        <Field label="Industry" error={errors.industry}>
          <Input name="industry" placeholder="e.g. Manufacturing" error={!!errors.industry} />
        </Field>
        {!product && (
          <Field label="Interested in" error={errors.product}>
            <Select name="product" options={PRODUCT_OPTIONS} placeholder="Select a solution" />
          </Field>
        )}
        {(isDemo || variant === 'quote_request') && (
          <Field label="Company size" error={errors.companySize}>
            <Select name="companySize" options={COMPANY_SIZES} placeholder="Select range" />
          </Field>
        )}
        <Field label="Timeline" error={errors.timeline}>
          <Select name="timeline" options={TIMELINES} placeholder="Select timeline" />
        </Field>
        <Field label="Budget range" error={errors.budget}>
          <Input name="budget" placeholder="Optional" error={!!errors.budget} />
        </Field>
      </div>

      {showFbr && (
        <Field label="Current invoicing / accounting system" error={errors.currentSystem}>
          <Input name="currentSystem" placeholder="e.g. QuickBooks, manual, in-house" />
        </Field>
      )}
      {showFbr && (
        <Field label="FBR requirements" error={errors.fbrRequirements}>
          <Textarea name="fbrRequirements" placeholder="POS integration, sales-tax returns, number of branches…" />
        </Field>
      )}
      {showProblem && (
        <Field label="What business problem are you solving?" required error={errors.businessProblem}>
          <Textarea name="businessProblem" required />
        </Field>
      )}

      <Field label={isDemo ? 'What would you like to see in the demo?' : 'How can we help?'} error={errors.requirements || errors.message}>
        <Textarea name={isDemo ? 'requirements' : 'message'} />
      </Field>

      <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
        {isDemo ? 'Request a Demo' : variant === 'quote_request' ? 'Request a Quote' : 'Send message'}
      </Button>
      <p className="text-xs text-slate-400">
        By submitting you agree to be contacted about your enquiry. We never share your details.
      </p>
    </form>
  );
}

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { crmApi } from '../crmApi';
import { ApiError } from '@/lib/apiClient';

const PRODUCTS = ['ERP Suite', 'FBR Invoicing', 'Cloud & AI', 'Custom Software', 'Unspecified'];
const SERVICES = ['Demo', 'Consultation', 'Quote', 'Support', 'Partnership', 'General'];

export function NewLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    try {
      const res = await crmApi.createLead(body);
      toast({ type: 'success', title: res.deduplicated ? 'Existing lead updated' : 'Lead created', description: res.lead.ref });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast({ type: 'error', title: 'Could not create lead', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New lead"
      subtitle="Manually add a lead — it is scored and de-duplicated like inbound enquiries."
    >
      <form id="new-lead-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name}>
            <Input name="name" required error={!!errors.name} />
          </Field>
          <Field label="Email" error={errors.email} hint="Email or phone required">
            <Input name="email" type="email" error={!!errors.email} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input name="phone" error={!!errors.phone} />
          </Field>
          <Field label="Company" error={errors.company}>
            <Input name="company" />
          </Field>
          <Field label="Industry" error={errors.industry}>
            <Input name="industry" />
          </Field>
          <Field label="Product interest">
            <Select name="product" options={PRODUCTS.map((p) => ({ label: p, value: p }))} placeholder="Unspecified" />
          </Field>
          <Field label="Service type">
            <Select name="serviceType" options={SERVICES.map((p) => ({ label: p, value: p }))} placeholder="General" />
          </Field>
          <Field label="Timeline">
            <Input name="timeline" placeholder="e.g. This quarter" />
          </Field>
        </div>
        <Field label="Notes / requirements" error={errors.requirements}>
          <Textarea name="requirements" />
        </Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button form="new-lead-form" type="submit" loading={submitting}>Create lead</Button>
      </div>
    </Modal>
  );
}

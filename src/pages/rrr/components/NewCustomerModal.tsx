import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { rrrApi, type RrrCustomer } from '../rrrApi';

export function NewCustomerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (customer: RrrCustomer) => void }) {
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
      const res = await rrrApi.createCustomer(body);
      toast({ type: 'success', title: 'Customer added', description: res.customer.name });
      onCreated(res.customer);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast({ type: 'error', title: 'Could not add customer', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New customer" subtitle="Saved to the real customer list — reusable on future RRRs." size="sm">
      <form id="new-customer-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Company name" required error={errors.name}>
          <Input name="name" required error={!!errors.name} />
        </Field>
        <Field label="Industry" error={errors.industry}>
          <Input name="industry" />
        </Field>
        <Field label="City" error={errors.city}>
          <Input name="city" />
        </Field>
        <Field label="Contact name" error={errors.contactName}>
          <Input name="contactName" />
        </Field>
        <Field label="Contact phone" error={errors.contactPhone}>
          <Input name="contactPhone" />
        </Field>
        <Field label="Contact email" error={errors.contactEmail}>
          <Input name="contactEmail" type="email" />
        </Field>
        <Field label="Contract type">
          <Select name="contractType" options={[{ label: 'Contract', value: 'Contract' }, { label: 'Spot', value: 'Spot' }, { label: 'Rate Card', value: 'Rate Card' }]} placeholder="Spot" />
        </Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button form="new-customer-form" type="submit" loading={submitting}>Add customer</Button>
      </div>
    </Modal>
  );
}

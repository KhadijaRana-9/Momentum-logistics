import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { opsApi, type Driver } from '@/lib/opsApi';

export function NewDriverModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (d: Driver) => void }) {
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
      const driver = await opsApi.drivers.create(body);
      toast({ type: 'success', title: 'Driver added', description: driver.name });
      onCreated(driver);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast({ type: 'error', title: 'Could not add driver', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New driver" subtitle="Saved to the real driver roster." size="sm">
      <form id="new-driver-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.name}><Input name="name" required error={!!errors.name} /></Field>
        <Field label="Phone" error={errors.phone}><Input name="phone" /></Field>
        <Field label="Nationality" error={errors.nationality}><Input name="nationality" /></Field>
        <Field label="License number" required error={errors.licenseNumber}><Input name="licenseNumber" required error={!!errors.licenseNumber} /></Field>
        <Field label="License expiry" error={errors.licenseExpiry}><Input name="licenseExpiry" type="date" /></Field>
        <Field label="Home branch" error={errors.homeBranch}><Input name="homeBranch" /></Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button form="new-driver-form" type="submit" loading={submitting}>Add driver</Button>
      </div>
    </Modal>
  );
}

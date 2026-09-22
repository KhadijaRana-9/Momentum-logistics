import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { opsApi, type Vehicle } from '@/lib/opsApi';

export function NewVehicleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (v: Vehicle) => void }) {
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
      const vehicle = await opsApi.vehicles.create(body);
      toast({ type: 'success', title: 'Vehicle added', description: vehicle.unitNumber });
      onCreated(vehicle);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast({ type: 'error', title: 'Could not add vehicle', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New vehicle" subtitle="Saved to the real fleet roster." size="sm">
      <form id="new-vehicle-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Unit number" required error={errors.unitNumber}><Input name="unitNumber" required error={!!errors.unitNumber} placeholder="MLX-101" /></Field>
        <Field label="Registration" required error={errors.registration}><Input name="registration" required error={!!errors.registration} placeholder="Dubai A 44219" /></Field>
        <Field label="Type" required error={errors.type}><Input name="type" required error={!!errors.type} placeholder="Flatbed Trailer" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make" error={errors.make}><Input name="make" /></Field>
          <Field label="Model" error={errors.model}><Input name="model" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year" error={errors.year}><Input name="year" type="number" /></Field>
          <Field label="Home branch" error={errors.homeBranch}><Input name="homeBranch" /></Field>
        </div>
        <Field label="Odometer (km)" error={errors.odometer}><Input name="odometer" type="number" defaultValue={0} /></Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button form="new-vehicle-form" type="submit" loading={submitting}>Add vehicle</Button>
      </div>
    </Modal>
  );
}

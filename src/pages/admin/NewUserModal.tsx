import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { crmApi } from '@/pages/crm/crmApi';
import { ApiError } from '@/lib/apiClient';
import { ROLES, ROLE_LABELS } from './rolePermissions';

/**
 * There is no invite-by-email flow yet (no email provider is configured),
 * so this creates the account directly with a password you set now and share
 * with the person — it does not send anything.
 */
export function NewUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      role: String(fd.get('role') ?? ''),
      password: String(fd.get('password') ?? ''),
    };
    try {
      const res = await crmApi.createUser(body);
      toast({ type: 'success', title: 'User created', description: `${res.user.name} (${res.user.role})` });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast({ type: 'error', title: 'Could not create user', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New user"
      subtitle="Creates the account directly with the password below — no invite email is sent yet."
    >
      <form id="new-user-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.name}>
          <Input name="name" required error={!!errors.name} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input name="email" type="email" required error={!!errors.email} />
        </Field>
        <Field label="Role" required error={errors.role}>
          <Select name="role" required options={ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r }))} placeholder="Select role" />
        </Field>
        <Field label="Initial password" required hint="At least 10 characters — share it with them directly" error={errors.password}>
          <Input name="password" type="text" required minLength={10} error={!!errors.password} />
        </Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button form="new-user-form" type="submit" loading={submitting}>Create user</Button>
      </div>
    </Modal>
  );
}

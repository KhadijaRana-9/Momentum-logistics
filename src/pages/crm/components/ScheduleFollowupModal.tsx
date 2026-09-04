import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from '../crmApi';
import type { TeamMember } from '../types';

const TYPES = ['Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export function ScheduleFollowupModal({
  open,
  onClose,
  leadId,
  team,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  team: TeamMember[];
  onScheduled: () => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
    body.leadId = leadId;
    try {
      await crmApi.createFollowup(body);
      toast({ type: 'success', title: 'Follow-up scheduled' });
      onScheduled();
      onClose();
    } catch (err) {
      toast({ type: 'error', title: 'Could not schedule', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up" size="sm">
      <form id="followup-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Due" required>
          <Input name="dueAt" type="datetime-local" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <Select name="type" options={TYPES.map((t) => ({ label: t, value: t }))} placeholder="Call" />
          </Field>
          <Field label="Priority">
            <Select name="priority" options={PRIORITIES.map((t) => ({ label: t, value: t }))} placeholder="Medium" />
          </Field>
        </div>
        {team.length > 0 && (
          <Field label="Assign to">
            <Select name="assignedTo" options={team.map((m) => ({ label: m.name, value: m.id }))} placeholder="Me" />
          </Field>
        )}
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button form="followup-form" type="submit" loading={submitting}>Schedule</Button>
      </div>
    </Modal>
  );
}

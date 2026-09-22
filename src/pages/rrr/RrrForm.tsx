import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Plus, Save, Send, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, FieldGroup, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { rrrApi, type RrrCustomer } from './rrrApi';
import { NewCustomerModal } from './components/NewCustomerModal';

const VEHICLE_TYPES = ['Flatbed Trailer', 'Curtain-side Trailer', 'Reefer Trailer', 'Tanker Trailer', 'Lowbed Trailer', 'Box Truck', 'Tipper Truck', 'Car Carrier'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export function RrrForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [customers, setCustomers] = useState<RrrCustomer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    rrrApi.customers(ctrl.signal).then((res) => setCustomers(res.items)).catch(() => {});
    return () => ctrl.abort();
  }, []);

  async function finish(mode: 'draft' | 'submit', e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!formRef.current) return;
    setSubmitting(mode);
    setErrors({});
    setFormError(null);

    const fd = new FormData(formRef.current);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    body.mode = mode;
    body.customerId = customerId;
    body.driverRequired = fd.get('driverRequired') === 'yes';

    if (!customerId) {
      setErrors({ customerId: 'Select a customer' });
      setSubmitting(null);
      return;
    }

    try {
      const res = await rrrApi.create(body);
      toast({
        type: 'success',
        title: mode === 'draft' ? 'Saved as draft' : 'RRR submitted for approval',
        description: `${res.rrr.ref} has been ${mode === 'draft' ? 'saved' : 'sent for approval'}.`,
      });
      navigate(`/app/rrr/${res.rrr.id}`);
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
      setSubmitting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="New Requisition Request"
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }, { label: 'New' }]}
        description="Fill in the sections below — a reference number is assigned when you save."
        actions={<Button variant="secondary" size="sm" onClick={() => navigate('/app/rrr')}>Cancel</Button>}
      />

      <form id="rrr-form" ref={formRef} onSubmit={(e) => finish('submit', e)} noValidate>
        {formError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{formError}</p>}

        <Card className="divide-y divide-slate-100 px-5">
          <FieldGroup title="Request Details" description="Basic information about who is requesting this transport.">
            <Field label="Customer" required error={errors.customerId}>
              <div className="flex gap-2">
                <Select
                  className="flex-1"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  options={customers.map((c) => ({ label: c.name, value: c.id }))}
                  placeholder={customers.length ? 'Select customer' : 'No customers yet'}
                />
                <Button type="button" variant="secondary" size="md" icon={Plus} onClick={() => setShowNewCustomer(true)} title="Add a new customer" />
              </div>
            </Field>
            <Field label="Requesting Department" error={errors.department}>
              <Input name="department" placeholder="e.g. Retail Distribution" />
            </Field>
            <Field label="Contract / Reference" hint="Optional — links this request to an existing rate contract" error={errors.contractRef}>
              <Input name="contractRef" placeholder="e.g. CTR-AFT-2024-018" />
            </Field>
            <Field label="Priority" required error={errors.priority}>
              <Select name="priority" required defaultValue="Medium" options={PRIORITIES.map((p) => ({ label: p, value: p }))} />
            </Field>
          </FieldGroup>

          <FieldGroup title="Vehicle & Driver Requirement" description="Specify the type of vehicle and staffing needed for this job.">
            <Field label="Vehicle Type" required error={errors.vehicleType}>
              <Select name="vehicleType" required options={VEHICLE_TYPES.map((v) => ({ label: v, value: v }))} placeholder="Select vehicle type" />
            </Field>
            <Field label="Driver Required">
              <Select name="driverRequired" defaultValue="yes" options={[{ label: 'Yes — assign company driver', value: 'yes' }, { label: 'No — self-drive / customer driver', value: 'no' }]} />
            </Field>
            <Field label="Number of Vehicles" hint="Leave as 1 unless this is a multi-vehicle movement" error={errors.numberOfVehicles}>
              <Input name="numberOfVehicles" type="number" min={1} defaultValue={1} />
            </Field>
          </FieldGroup>

          <FieldGroup title="Route & Schedule" columns={2}>
            <Field label="Pickup Location" required span="full" error={errors.pickup}><Input name="pickup" placeholder="e.g. Al Futtaim DC, Dubai Investment Park" required /></Field>
            <Field label="Destination" required span="full" error={errors.destination}><Input name="destination" placeholder="e.g. Landmark Hub, Riyadh" required /></Field>
            <Field label="Route Description" error={errors.route}><Input name="route" placeholder="e.g. Dubai → Riyadh (E11/E75)" /></Field>
            <Field label="Required Date & Time" required error={errors.requiredDate}><Input name="requiredDate" type="datetime-local" required /></Field>
          </FieldGroup>

          <FieldGroup title="Loading & Unloading Information">
            <Field label="Loading Information" span="full" error={errors.loadingInfo}>
              <Textarea name="loadingInfo" placeholder="Cargo description, quantity, handling requirements, loading point contact..." />
            </Field>
            <Field label="Unloading Information" span="full" error={errors.unloadingInfo}>
              <Textarea name="unloadingInfo" placeholder="Delivery point requirements, receiving hours, offload arrangements..." />
            </Field>
          </FieldGroup>

          <FieldGroup title="Special Instructions & Attachments">
            <Field label="Special Instructions" span="full" hint="Safety, handling, or compliance notes for the assigned driver" error={errors.specialInstructions}>
              <Textarea name="specialInstructions" placeholder="e.g. ADR-certified driver mandatory, temperature-sensitive cargo..." />
            </Field>
            <Field label="Attachments" span="full">
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
                <Upload size={18} className="mx-auto text-slate-400" />
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-slate-600">File uploads aren't available yet</p>
                  <p className="text-xs text-slate-400">PO, loading instructions, permits — coming in a later update</p>
                </div>
                <Button type="button" variant="secondary" size="sm" icon={Paperclip} disabled>Browse</Button>
              </div>
            </Field>
          </FieldGroup>
        </Card>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/app/rrr')}>Discard</Button>
          <Button type="button" variant="outline" icon={Save} loading={submitting === 'draft'} disabled={submitting !== null} onClick={() => finish('draft')}>Save as Draft</Button>
          <Button type="submit" variant="primary" icon={Send} loading={submitting === 'submit'} disabled={submitting !== null}>Submit for Approval</Button>
        </div>
      </form>

      <NewCustomerModal
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onCreated={(c) => { setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name))); setCustomerId(c.id); }}
      />
    </div>
  );
}

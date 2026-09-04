import { useNavigate } from 'react-router-dom';
import { Paperclip, Save, Send, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, FieldGroup, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { customers } from '@/data/customers';

const VEHICLE_TYPES = ['Flatbed Trailer', 'Curtain-side Trailer', 'Reefer Trailer', 'Tanker Trailer', 'Lowbed Trailer', 'Box Truck', 'Tipper Truck', 'Car Carrier'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const DEPARTMENTS = ['Retail Distribution', 'Cold Chain Ops', 'Raw Material Supply', 'Plant Dispatch', 'Project Cargo', 'Export Logistics', 'Store Supply'];

export function RrrForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const nextId = 'RRR-2026-0148';

  function finish(mode: 'draft' | 'submit') {
    toast({
      type: 'success',
      title: mode === 'draft' ? 'Saved as draft' : 'RRR submitted for approval',
      description: `${nextId} has been ${mode === 'draft' ? 'saved' : 'sent to Operations Director'}.`,
    });
    navigate('/app/rrr');
  }

  return (
    <div>
      <PageHeader
        title="New Requisition Request"
        breadcrumbs={[{ label: 'Operations' }, { label: 'RRR', to: '/app/rrr' }, { label: 'New' }]}
        description={`Draft reference ${nextId} — fill in the sections below to submit for approval.`}
        actions={<Button variant="secondary" size="sm" onClick={() => navigate('/app/rrr')}>Cancel</Button>}
      />

      <form onSubmit={(e) => { e.preventDefault(); finish('submit'); }}>
        <Card className="divide-y divide-slate-100 px-5">
          <FieldGroup title="Request Details" description="Basic information about who is requesting this transport.">
            <Field label="RRR Number"><Input value={nextId} disabled /></Field>
            <Field label="Request Date" required><Input type="date" defaultValue="2026-08-20" required /></Field>
            <Field label="Customer" required>
              <Select required options={customers.map((c) => ({ label: c.name, value: c.id }))} placeholder="Select customer" />
            </Field>
            <Field label="Requesting Department" required>
              <Select required options={DEPARTMENTS.map((d) => ({ label: d, value: d }))} placeholder="Select department" />
            </Field>
            <Field label="Contract / Reference" hint="Optional — links this request to an existing rate contract">
              <Input placeholder="e.g. CTR-AFT-2024-018" />
            </Field>
            <Field label="Priority" required>
              <Select required defaultValue="Medium" options={PRIORITIES.map((p) => ({ label: p, value: p }))} />
            </Field>
          </FieldGroup>

          <FieldGroup title="Vehicle & Driver Requirement" description="Specify the type of vehicle and staffing needed for this job.">
            <Field label="Vehicle Type" required>
              <Select required options={VEHICLE_TYPES.map((v) => ({ label: v, value: v }))} placeholder="Select vehicle type" />
            </Field>
            <Field label="Driver Required">
              <Select defaultValue="yes" options={[{ label: 'Yes — assign company driver', value: 'yes' }, { label: 'No — self-drive / customer driver', value: 'no' }]} />
            </Field>
            <Field label="Number of Vehicles" hint="Leave as 1 unless this is a multi-vehicle movement">
              <Input type="number" min={1} defaultValue={1} />
            </Field>
          </FieldGroup>

          <FieldGroup title="Route & Schedule" columns={2}>
            <Field label="Pickup Location" required span="full"><Input placeholder="e.g. Al Futtaim DC, Dubai Investment Park" required /></Field>
            <Field label="Destination" required span="full"><Input placeholder="e.g. Landmark Hub, Riyadh" required /></Field>
            <Field label="Route Description"><Input placeholder="e.g. Dubai → Riyadh (E11/E75)" /></Field>
            <Field label="Required Date & Time" required><Input type="datetime-local" required /></Field>
          </FieldGroup>

          <FieldGroup title="Loading & Unloading Information">
            <Field label="Loading Information" span="full">
              <Textarea placeholder="Cargo description, quantity, handling requirements, loading point contact..." />
            </Field>
            <Field label="Unloading Information" span="full">
              <Textarea placeholder="Delivery point requirements, receiving hours, offload arrangements..." />
            </Field>
          </FieldGroup>

          <FieldGroup title="Special Instructions & Attachments">
            <Field label="Special Instructions" span="full" hint="Safety, handling, or compliance notes for the assigned driver">
              <Textarea placeholder="e.g. ADR-certified driver mandatory, temperature-sensitive cargo..." />
            </Field>
            <Field label="Attachments" span="full">
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
                <Upload size={18} className="mx-auto text-slate-400" />
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-slate-600">Drop files here or click to upload</p>
                  <p className="text-xs text-slate-400">PO, loading instructions, permits (PDF, JPG up to 10MB)</p>
                </div>
                <Button type="button" variant="secondary" size="sm" icon={Paperclip}>Browse</Button>
              </div>
            </Field>
          </FieldGroup>
        </Card>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/app/rrr')}>Discard</Button>
          <Button type="button" variant="outline" icon={Save} onClick={() => finish('draft')}>Save as Draft</Button>
          <Button type="submit" variant="primary" icon={Send}>Submit for Approval</Button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import {
  Building2, Calendar, Coins, FileDigit, GitBranch, Landmark, Save, Settings2, Sliders,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, FieldGroup, Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'departments', label: 'Departments', icon: Sliders },
  { id: 'cost-centres', label: 'Cost Centres', icon: Landmark },
  { id: 'financial', label: 'Financial Periods', icon: Calendar },
  { id: 'numbering', label: 'Document Numbering', icon: FileDigit },
  { id: 'currency', label: 'Currency & Tax', icon: Coins },
  { id: 'system', label: 'System Parameters', icon: Settings2 },
];

const BRANCHES = ['Dubai HQ', 'Abu Dhabi Branch', 'Riyadh Branch', 'Sharjah Branch', 'Muscat Branch'];
const DEPARTMENTS = ['Operations', 'Dispatch', 'Finance', 'Fleet & Maintenance', 'Commercial', 'Compliance', 'IT', 'Human Resources'];
const COST_CENTRES = ['CC-100 — Dubai Operations', 'CC-200 — Abu Dhabi Operations', 'CC-300 — Workshop & Maintenance', 'CC-400 — Corporate Overhead'];

export function SettingsPage() {
  const [section, setSection] = useState('company');
  const toast = useToast();

  function save() {
    toast({ type: 'success', title: 'Settings saved', description: 'Your changes have been applied.' });
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Company, financial, and system configuration."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                  section === s.id ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <s.icon size={15} />
                {s.label}
              </button>
            ))}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="px-5">
            {section === 'company' && (
              <FieldGroup title="Company Profile" description="Core company information used across documents.">
                <Field label="Company Name"><Input defaultValue="Momentum Logistics LLC" /></Field>
                <Field label="Trade License #"><Input defaultValue="DED-778213" /></Field>
                <Field label="Head Office" span="full"><Input defaultValue="Dubai Investment Park, Dubai, UAE" /></Field>
                <Field label="Phone"><Input defaultValue="+971 4 338 2210" /></Field>
                <Field label="Email"><Input defaultValue="info@momentumlogistics.com" /></Field>
              </FieldGroup>
            )}

            {section === 'branches' && (
              <FieldGroup title="Branches" description="Operating branches across the network.">
                {BRANCHES.map((b) => (
                  <Field key={b} label={b}><Input defaultValue="Active" disabled /></Field>
                ))}
              </FieldGroup>
            )}

            {section === 'departments' && (
              <FieldGroup title="Departments" columns={3}>
                {DEPARTMENTS.map((d) => (
                  <Field key={d} label={d}><Input defaultValue="Enabled" disabled /></Field>
                ))}
              </FieldGroup>
            )}

            {section === 'cost-centres' && (
              <FieldGroup title="Cost Centres" description="Used for expense and maintenance cost allocation.">
                {COST_CENTRES.map((c) => (
                  <Field key={c} label={c} span="full"><Input defaultValue="Active" disabled /></Field>
                ))}
              </FieldGroup>
            )}

            {section === 'financial' && (
              <FieldGroup title="Financial Periods" description="Fiscal year and period locking configuration.">
                <Field label="Fiscal Year Start"><Select defaultValue="jan" options={[{ label: 'January', value: 'jan' }, { label: 'April', value: 'apr' }]} /></Field>
                <Field label="Current Period"><Input defaultValue="August 2026" disabled /></Field>
                <Field label="Period Lock Status"><Select defaultValue="open" options={[{ label: 'Open', value: 'open' }, { label: 'Locked', value: 'locked' }]} /></Field>
                <Field label="Auto-close Period"><Select defaultValue="no" options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} /></Field>
              </FieldGroup>
            )}

            {section === 'numbering' && (
              <FieldGroup title="Document Numbering" description="Auto-numbering format for key documents." columns={2}>
                <Field label="RRR Prefix"><Input defaultValue="RRR-2026-####" /></Field>
                <Field label="Job Prefix"><Input defaultValue="JOB-2026-####" /></Field>
                <Field label="Trip Prefix"><Input defaultValue="TRP-2026-####" /></Field>
                <Field label="Invoice Prefix"><Input defaultValue="INV-2026-####" /></Field>
              </FieldGroup>
            )}

            {section === 'currency' && (
              <FieldGroup title="Currency & Tax" columns={2}>
                <Field label="Base Currency"><Select defaultValue="aed" options={[{ label: 'AED — UAE Dirham', value: 'aed' }, { label: 'USD — US Dollar', value: 'usd' }]} /></Field>
                <Field label="VAT Rate"><Input defaultValue="5%" /></Field>
                <Field label="Tax Registration #"><Input defaultValue="100234567800003" /></Field>
                <Field label="Rounding Method"><Select defaultValue="nearest" options={[{ label: 'Nearest', value: 'nearest' }, { label: 'Round Up', value: 'up' }]} /></Field>
              </FieldGroup>
            )}

            {section === 'system' && (
              <FieldGroup title="System Parameters" columns={2}>
                <Field label="Default Language"><Select defaultValue="en" options={[{ label: 'English', value: 'en' }, { label: 'Arabic', value: 'ar' }]} /></Field>
                <Field label="Timezone"><Select defaultValue="dxb" options={[{ label: 'Asia/Dubai (GST +4)', value: 'dxb' }]} /></Field>
                <Field label="Session Timeout"><Input defaultValue="30 minutes" /></Field>
                <Field label="Distance Unit"><Select defaultValue="km" options={[{ label: 'Kilometers', value: 'km' }, { label: 'Miles', value: 'mi' }]} /></Field>
              </FieldGroup>
            )}

            <div className="flex justify-end border-t border-slate-100 py-4">
              <Button variant="primary" icon={Save} onClick={save}>Save Changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

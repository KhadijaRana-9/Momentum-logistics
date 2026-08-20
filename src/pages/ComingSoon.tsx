import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState icon={Construction} title="Module under construction" description="This section is being built out as part of the prototype rollout." />
      </div>
    </div>
  );
}

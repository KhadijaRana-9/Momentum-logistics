import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FieldGroup({ title, description, children, columns = 2 }: { title?: string; description?: string; children: ReactNode; columns?: 1 | 2 | 3 }) {
  return (
    <div className="border-b border-slate-100 py-5 first:pt-0 last:border-b-0">
      {title && (
        <div className="mb-4">
          <h4 className="font-display text-sm font-semibold text-brand-950">{title}</h4>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      )}
      <div className={cn('grid gap-4', columns === 1 && 'grid-cols-1', columns === 2 && 'grid-cols-1 sm:grid-cols-2', columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, required, hint, error, className, children, span }: { label?: string; required?: boolean; hint?: string; error?: string; className?: string; children: ReactNode; span?: 'full' }) {
  return (
    <label className={cn('block', span === 'full' && 'sm:col-span-2 lg:col-span-3', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

const fieldBase = 'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-brand-950 placeholder:text-slate-400 transition-colors duration-150 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-400';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, 'h-9', error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-[84px] py-2 resize-y', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(fieldBase, 'h-9 appearance-none pr-9', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = 'Select';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { type LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-800 text-white shadow-xs hover:bg-brand-900 hover:shadow-card active:bg-brand-950 focus-visible:outline-brand-600',
  secondary: 'border border-slate-200 bg-white text-brand-900 shadow-xs hover:border-brand-200 hover:bg-slate-50 hover:shadow-xs active:bg-slate-100',
  outline: 'border border-brand-200 bg-transparent text-brand-800 hover:bg-brand-50 hover:border-brand-300 active:bg-brand-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200',
};

const sizeClasses: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-lg',
};

const iconSize: Record<Size, number> = { xs: 13, sm: 14, md: 16, lg: 18 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-none',
          'hover:-translate-y-px active:translate-y-0 active:scale-[0.985]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSize[size]} className="animate-spin" />
        ) : (
          Icon && iconPosition === 'left' && <Icon size={iconSize[size]} strokeWidth={2.2} />
        )}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon size={iconSize[size]} strokeWidth={2.2} />}
      </button>
    );
  },
);
Button.displayName = 'Button';

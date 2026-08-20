import logoSrc from '@/assets/brand/logo.png';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
}

/** The raw Momentum Logistics emblem, at its native aspect ratio. Never stretch or crop this. */
export function LogoMark({ size = 32, className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Momentum Logistics"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * The emblem set on a clean white chip — use this whenever the surrounding surface
 * is dark or colored, so the logo keeps maximum clarity (per brand guidelines).
 */
export function LogoBadge({ size = 32, padding = 6, className }: LogoProps & { padding?: number }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-lg bg-white shadow-xs', className)}
      style={{ width: size + padding * 2, height: size + padding * 2 }}
    >
      <LogoMark size={size} />
    </span>
  );
}

interface TooltipEntry {
  value: number;
  name: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-popover backdrop-blur-sm">
      {label && <p className="mb-1 text-[11px] font-semibold text-slate-500">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => {
          const [val, name] = formatter ? formatter(p.value, p.name) : [String(p.value), p.name];
          return (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-slate-500">{name}</span>
              <span className="ml-auto font-semibold text-brand-950">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

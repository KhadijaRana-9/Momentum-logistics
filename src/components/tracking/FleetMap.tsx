import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CITY_COORDS, findCityCoords } from '@/data/mapCoords';
import type { Vehicle } from '@/data/types';

const STATUS_DOT: Record<Vehicle['status'], string> = {
  Moving: '#008838',
  Idle: '#f59e0b',
  Offline: '#94a3b8',
  Maintenance: '#f97316',
  'Out of Service': '#e11d48',
};

const GEOFENCES = ['Dubai', 'Riyadh', 'Abu Dhabi'];

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  destinations: Record<string, string | undefined>;
}

export function FleetMap({ vehicles, selectedId, onSelect, destinations }: FleetMapProps) {
  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
      {/* grid pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* geofences */}
      {GEOFENCES.map((city) => {
        const c = CITY_COORDS[city];
        return (
          <div
            key={city}
            className="absolute rounded-full border border-dashed border-sky-400/30"
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: 110, height: 110, transform: 'translate(-50%, -50%)' }}
          />
        );
      })}

      {/* city labels */}
      {Object.entries(CITY_COORDS).map(([city, c]) => (
        <div key={city} className="absolute flex flex-col items-center" style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span className="mt-1 whitespace-nowrap text-[10px] font-medium text-white/35">{city}</span>
        </div>
      ))}

      {/* route lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {vehicles.map((v) => {
          const dest = destinations[v.id];
          const destCoords = dest ? findCityCoords(dest) : null;
          if (!destCoords) return null;
          return (
            <line
              key={v.id}
              x1={v.coords.x} y1={v.coords.y} x2={destCoords.x} y2={destCoords.y}
              stroke={selectedId === v.id ? '#38bdf8' : 'rgba(56,189,248,0.25)'}
              strokeWidth={selectedId === v.id ? 0.35 : 0.22}
              strokeDasharray="1.2 1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* vehicle markers */}
      {vehicles.map((v) => {
        const isSelected = selectedId === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${v.coords.x}%`, top: `${v.coords.y}%` }}
          >
            {v.status === 'Moving' && (
              <motion.span
                className="absolute h-6 w-6 rounded-full"
                style={{ backgroundColor: STATUS_DOT[v.status] }}
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <span
              className={cn(
                'relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/90 shadow-lg transition-transform',
                isSelected && 'scale-125 ring-4 ring-sky-400/40',
              )}
              style={{ backgroundColor: STATUS_DOT[v.status] }}
            >
              <Truck size={11} className="text-white" strokeWidth={2.5} />
            </span>
            {isSelected && (
              <span className="absolute top-7 whitespace-nowrap rounded-md bg-white px-2 py-0.5 text-[10.5px] font-semibold text-brand-950 shadow-popover">
                {v.unitNumber}
              </span>
            )}
          </button>
        );
      })}

      {/* legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(STATUS_DOT) as Vehicle['status'][]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT[s] }} />
            <span className="text-[10.5px] font-medium text-white/70">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

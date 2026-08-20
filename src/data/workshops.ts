import type { Workshop } from './types';

export const workshops: Workshop[] = [
  { id: 'WS-01', name: 'Momentum Central Workshop', type: 'Internal', city: 'Dubai', specialties: ['Engine Overhaul', 'Electrical', 'Brakes'], contact: '+971 4 338 2210', activeJobs: 4, rating: 4.7 },
  { id: 'WS-02', name: 'Mussafah Fleet Service Center', type: 'Internal', city: 'Abu Dhabi', specialties: ['Preventive Maintenance', 'Tyres', 'AC Systems'], contact: '+971 2 550 1187', activeJobs: 3, rating: 4.6 },
  { id: 'WS-03', name: 'Al Ain Truck & Trailer Repair', type: 'External', city: 'Al Ain', specialties: ['Trailer Repair', 'Welding'], contact: '+971 3 721 9042', activeJobs: 1, rating: 4.3 },
  { id: 'WS-04', name: 'Gulf Diesel Technics', type: 'External', city: 'Sharjah', specialties: ['Diesel Systems', 'Turbocharger'], contact: '+971 6 534 6621', activeJobs: 2, rating: 4.5 },
  { id: 'WS-05', name: 'Riyadh Heavy Vehicle Workshop', type: 'External', city: 'Riyadh', specialties: ['Engine Overhaul', 'Hydraulics'], contact: '+966 11 208 7734', activeJobs: 2, rating: 4.4 },
  { id: 'WS-06', name: 'Muscat Fleet Care', type: 'Internal', city: 'Muscat', specialties: ['Preventive Maintenance', 'Electrical'], contact: '+968 24 601 3352', activeJobs: 1, rating: 4.8 },
];

export function getWorkshop(id: string) {
  return workshops.find((w) => w.id === id);
}

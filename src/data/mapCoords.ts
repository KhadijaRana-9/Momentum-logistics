export const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'Kuwait City': { x: 38, y: 8 },
  'Dammam': { x: 46, y: 22 },
  'Jubail': { x: 47, y: 18 },
  'Riyadh': { x: 42, y: 40 },
  'Jeddah': { x: 15, y: 48 },
  'Doha': { x: 58, y: 35 },
  'Abu Dhabi': { x: 70, y: 48 },
  'Dubai': { x: 76, y: 42 },
  'Sharjah': { x: 78, y: 38 },
  'Al Ain': { x: 74, y: 58 },
  'Ras Al Khaimah': { x: 80, y: 27 },
  'Muscat': { x: 88, y: 61 },
};

export function findCityCoords(place: string): { x: number; y: number } | null {
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (place.includes(city)) return coords;
  }
  return null;
}

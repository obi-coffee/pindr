const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'pindr/1.0 (support@pindr.app)';

export type GeocodeResult = {
  label: string;
  city: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`geocoder error: ${res.status}`);
  const data = (await res.json()) as NominatimResult[];
  const seen = new Set<string>();
  const out: GeocodeResult[] = [];
  for (const r of data) {
    const g = toGeocodeResult(r);
    if (!g) continue;
    const key = `${g.city.toLowerCase()}|${g.latitude.toFixed(2)}|${g.longitude.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}

function toGeocodeResult(r: NominatimResult): GeocodeResult | null {
  const addr = r.address ?? {};
  const place = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? '';
  if (!place) return null;
  const city = [place, addr.state].filter(Boolean).join(', ');
  const label = [place, addr.state, addr.country].filter(Boolean).join(', ');
  const lat = Number(r.lat);
  const lon = Number(r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    label: label || r.display_name,
    city: city || place,
    latitude: lat,
    longitude: lon,
  };
}

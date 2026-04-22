import AsyncStorage from '@react-native-async-storage/async-storage';
import { GENDER_OPTIONS } from '../profile/schemas';

export type PlayStyleFilter = 'relaxed' | 'improvement' | 'competitive';

const VALID_GENDERS = new Set<string>(GENDER_OPTIONS.map((g) => g.value));
const LEGACY_GENDER_MAP: Record<string, string> = {
  Woman: 'woman',
  Man: 'man',
  'Non-binary': 'nonbinary',
};

function normalizeGenders(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const migrated = input
    .map((g) => (typeof g === 'string' ? (LEGACY_GENDER_MAP[g] ?? g) : null))
    .filter((g): g is string => g !== null && VALID_GENDERS.has(g));
  return migrated.length === 0 ? null : migrated;
}

export type DiscoverFilters = {
  maxDistanceKm: number;
  minAge: number | null;
  maxAge: number | null;
  genders: string[] | null;
  minHandicap: number | null;
  maxHandicap: number | null;
  playStyles: PlayStyleFilter[] | null;
  womenOnly: boolean;
};

export const DEFAULT_FILTERS: DiscoverFilters = {
  maxDistanceKm: 100,
  minAge: null,
  maxAge: null,
  genders: null,
  minHandicap: null,
  maxHandicap: null,
  playStyles: null,
  womenOnly: false,
};

const STORAGE_KEY = 'pindr.discoverFilters.v1';

export async function loadFilters(): Promise<DiscoverFilters> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<DiscoverFilters>;
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
      genders: normalizeGenders(parsed.genders),
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export async function saveFilters(filters: DiscoverFilters): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlayStyleFilter = 'relaxed' | 'improvement' | 'competitive';

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
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export async function saveFilters(filters: DiscoverFilters): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

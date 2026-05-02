import { supabase } from '../supabase';
import type { DiscoverFilters } from './filters';

export type Candidate = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  pronouns: string | null;
  bio: string | null;
  home_city: string | null;
  home_course_name: string | null;
  gender: string | null;
  handicap: number | null;
  has_handicap: boolean;
  years_playing: number | null;
  walking_preference: string | null;
  holes_preference: string | null;
  pace: string | null;
  betting: string | null;
  drinks: string | null;
  post_round: string | null;
  teaching_mindset: string | null;
  style_default: string | null;
  photo_urls: string[];
  distance_km: number | null;
  upcoming_round_id: string | null;
  upcoming_round_tee_time: string | null;
  upcoming_round_course_name: string | null;
  // Set by get_profile_by_id (Phase 2). discover_candidates does not
  // populate this — it's not surfaced on the deck card. Treat as
  // optional client-side.
  profile_answers?: Record<string, string>;
};

export async function fetchCandidates(
  filters: DiscoverFilters,
): Promise<Candidate[]> {
  const { data, error } = await supabase.rpc('discover_candidates', {
    max_distance_km: filters.maxDistanceKm,
    min_age: filters.minAge,
    max_age: filters.maxAge,
    genders: filters.genders,
    min_handicap: filters.minHandicap,
    max_handicap: filters.maxHandicap,
    play_styles: filters.playStyles,
    women_only: filters.womenOnly,
  });
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

// Fetch a single profile by user_id. Returns null if blocked,
// not-onboarded, the caller themselves, or simply doesn't exist.
// Backed by the get_profile_by_id RPC (SECURITY DEFINER) since direct
// profiles SELECT is owner-only.
export async function fetchProfileById(
  userId: string,
): Promise<Candidate | null> {
  const { data, error } = await supabase.rpc('get_profile_by_id', {
    target_user_id: userId,
  });
  if (error) throw error;
  const rows = (data ?? []) as Candidate[];
  return rows[0] ?? null;
}

export type SwipeDirection = 'right' | 'left' | 'super';

export type SwipeResult =
  | { matched: false }
  | { matched: true; matchId: string };

export async function recordSwipe(
  swiperId: string,
  swipeeId: string,
  direction: SwipeDirection,
): Promise<SwipeResult> {
  const { error: insertError } = await supabase.from('swipes').insert({
    swiper_id: swiperId,
    swipee_id: swipeeId,
    direction,
  });
  if (insertError) throw insertError;

  if (direction === 'left') return { matched: false };

  const lo = swiperId < swipeeId ? swiperId : swipeeId;
  const hi = swiperId < swipeeId ? swipeeId : swiperId;
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('user_a_id', lo)
    .eq('user_b_id', hi)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { matched: false };
  return { matched: true, matchId: data.id as string };
}

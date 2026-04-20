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

export type SwipeDirection = 'right' | 'left' | 'super';

export async function recordSwipe(
  swiperId: string,
  swipeeId: string,
  direction: SwipeDirection,
): Promise<{ matched: boolean }> {
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
  return { matched: Boolean(data) };
}

import { supabase } from '../supabase';

export type Candidate = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  pronouns: string | null;
  bio: string | null;
  home_city: string | null;
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
  maxDistanceKm = 100,
): Promise<Candidate[]> {
  const { data, error } = await supabase.rpc('discover_candidates', {
    max_distance_km: maxDistanceKm,
  });
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

import { supabase } from './supabase';
import { loadFilters } from './discover/filters';

export type Regular = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  pronouns: string | null;
  photo_urls: string[];
  style_default: string | null;
};

// Who else calls the caller's home course home. Server-side the RPC
// mirrors discovery eligibility (blocks both ways, onboarded,
// women-only guard); the caller's stored women-only filter is passed
// through so this list never shows someone the deck wouldn't.
export async function fetchRegulars(): Promise<Regular[]> {
  const filters = await loadFilters();
  const { data, error } = await supabase.rpc('get_home_course_regulars', {
    women_only: filters.womenOnly,
  });
  if (error) throw error;
  return (data ?? []) as Regular[];
}

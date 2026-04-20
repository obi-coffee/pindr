import { supabase } from '../supabase';

export type MatchSummary = {
  match_id: string;
  matched_at: string;
  other_user_id: string;
  other_display_name: string | null;
  other_photo_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export async function fetchMatches(): Promise<MatchSummary[]> {
  const { data, error } = await supabase.rpc('list_matches');
  if (error) throw error;
  return (data ?? []) as MatchSummary[];
}

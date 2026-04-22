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

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  // UI-only marker set on client-side temp rows inserted before the
  // server confirms the send. Never present on rows fetched or
  // delivered via realtime.
  _pending?: boolean;
};

export type MatchDetails = {
  match_id: string;
  other_user_id: string;
  other_display_name: string | null;
  other_photo_url: string | null;
};

export async function fetchMatches(): Promise<MatchSummary[]> {
  const { data, error } = await supabase.rpc('list_matches');
  if (error) throw error;
  return (data ?? []) as MatchSummary[];
}

export async function fetchMatchDetails(
  matchId: string,
  myUserId: string,
): Promise<MatchDetails | null> {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user_a_id, user_b_id')
    .eq('id', matchId)
    .maybeSingle();
  if (matchError) throw matchError;
  if (!match) return null;

  const otherId =
    match.user_a_id === myUserId ? match.user_b_id : match.user_a_id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, photo_urls')
    .eq('user_id', otherId)
    .maybeSingle();
  if (profileError) throw profileError;

  return {
    match_id: match.id,
    other_user_id: otherId,
    other_display_name: profile?.display_name ?? null,
    other_photo_url: profile?.photo_urls?.[0] ?? null,
  };
}

export async function fetchMessages(
  matchId: string,
  limit = 100,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, body, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  body: string,
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Message is empty');
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      body: trimmed,
    })
    .select('id, match_id, sender_id, body, created_at')
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function markMatchRead(
  matchId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('match_reads').upsert(
    {
      match_id: matchId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'match_id,user_id' },
  );
  if (error) throw error;
}

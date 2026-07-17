import { supabase } from '../supabase';
import {
  listJoinedRounds,
  listMyRounds,
  type RoundWithCourse,
} from './queries';

// Post-round check-ins (Loop Phase C). One row per (round, user); the
// answer to "did it happen, and how was it?" the morning after a locked
// round. Answers are private to the answering user — no ratings shown
// to anyone.

export type CheckinFeel = 'great' | 'fine' | 'noshow';

export type RoundCheckin = {
  round_id: string;
  user_id: string;
  played: boolean;
  feel: CheckinFeel | null;
  created_at: string;
};

export async function listMyCheckins(userId: string): Promise<RoundCheckin[]> {
  const { data, error } = await supabase
    .from('round_checkins')
    .select('round_id, user_id, played, feel, created_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as RoundCheckin[];
}

export async function submitCheckin(input: {
  roundId: string;
  userId: string;
  played: boolean;
  feel: CheckinFeel | null;
}): Promise<void> {
  const { error } = await supabase.from('round_checkins').upsert(
    {
      round_id: input.roundId,
      user_id: input.userId,
      played: input.played,
      feel: input.feel,
    },
    { onConflict: 'round_id,user_id' },
  );
  if (error) throw error;
}

/**
 * Locked rounds whose tee time has passed and that this user hasn't
 * checked in on yet — the rounds the check-in card should prompt for.
 * Oldest first so the card clears in order.
 */
export async function listPendingCheckinRounds(
  userId: string,
): Promise<RoundWithCourse[]> {
  const [hosted, joined, checkins] = await Promise.all([
    listMyRounds(userId),
    listJoinedRounds(userId),
    listMyCheckins(userId),
  ]);
  const checked = new Set(checkins.map((c) => c.round_id));
  const now = Date.now();
  const byId = new Map<string, RoundWithCourse>();
  for (const r of [...hosted, ...joined]) byId.set(r.id, r);
  return [...byId.values()]
    .filter(
      (r) =>
        r.origin_match_id !== null &&
        // 'open' too: a locked round with an unfilled extra seat
        // (Phase F) still happened and still deserves a check-in.
        (r.status === 'full' || r.status === 'open') &&
        new Date(r.tee_time).getTime() < now &&
        !checked.has(r.id),
    )
    .sort((a, b) => a.tee_time.localeCompare(b.tee_time));
}

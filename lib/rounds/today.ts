import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
  listJoinedRounds,
  listMyRounds,
  type RoundWithCourse,
} from './queries';

// Day-of helpers (Loop Phase D). A locked round counts as "today" from
// 18 hours before tee time until 4 hours after — wide enough that an
// evening-before glance and a post-round straggle both see the card.

const TODAY_BEFORE_MS = 18 * 3600 * 1000;
const TODAY_AFTER_MS = 4 * 3600 * 1000;

export function isRoundToday(round: RoundWithCourse, now = Date.now()): boolean {
  const tee = new Date(round.tee_time).getTime();
  return now >= tee - TODAY_BEFORE_MS && now <= tee + TODAY_AFTER_MS;
}

/** Locked rounds in the day-of window, soonest first. */
export async function listTodayLockedRounds(
  userId: string,
): Promise<RoundWithCourse[]> {
  const [hosted, joined] = await Promise.all([
    listMyRounds(userId),
    listJoinedRounds(userId),
  ]);
  const byId = new Map<string, RoundWithCourse>();
  for (const r of [...hosted, ...joined]) byId.set(r.id, r);
  return [...byId.values()]
    .filter(
      (r) =>
        r.origin_match_id !== null &&
        // 'open' too: a locked round hunting for a third (Phase F)
        // still deserves its day-of card.
        (r.status === 'full' || r.status === 'open') &&
        isRoundToday(r),
    )
    .sort((a, b) => a.tee_time.localeCompare(b.tee_time));
}

export async function announceArrival(roundId: string): Promise<void> {
  const { error } = await supabase.rpc('announce_arrival', {
    p_round_id: roundId,
  });
  if (error) throw error;
}

const ARRIVAL_KEY_PREFIX = 'pindr.arrival.';

// "i'm here" is one-shot per round. The server dedupes the push; this
// hook keeps the button honest across app restarts via AsyncStorage.
export type UseArrival = {
  announced: boolean;
  busy: boolean;
  announce: () => Promise<void>;
};

export function useArrival(roundId: string): UseArrival {
  const [announced, setAnnounced] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ARRIVAL_KEY_PREFIX + roundId).then((value) => {
      if (!cancelled && value === 'true') setAnnounced(true);
    });
    return () => {
      cancelled = true;
    };
  }, [roundId]);

  const announce = useCallback(async () => {
    if (announced || busy) return;
    setBusy(true);
    try {
      await announceArrival(roundId);
      setAnnounced(true);
      AsyncStorage.setItem(ARRIVAL_KEY_PREFIX + roundId, 'true').catch(
        () => {},
      );
    } finally {
      setBusy(false);
    }
  }, [announced, busy, roundId]);

  return { announced, busy, announce };
}

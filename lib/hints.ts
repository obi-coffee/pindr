import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// First-run hints (1.0.1 Phase E). Seen-state is device-level
// AsyncStorage on purpose: the tips teach the app, not the account,
// and a reinstall replaying them is acceptable (per the build plan).
// No schema, no server round-trips.

export type HintId = 'deck' | 'chat' | 'rounds';

const SEEN_KEY = 'pindr.hints_seen';
const SKIP_KEY = 'pindr.hints_skipped';

async function readSeen(): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
}

export async function markHintSeen(id: HintId): Promise<void> {
  try {
    const seen = await readSeen();
    seen[id] = true;
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Storage hiccup: worst case the hint shows again later.
  }
}

export async function skipAllHints(): Promise<void> {
  try {
    await AsyncStorage.setItem(SKIP_KEY, '1');
  } catch {
    // Same non-fatal stance as above.
  }
}

// One hook per call site. `enabled` gates on the screen being in a
// teachable state (deck has cards, chat has loaded, …) so a hint never
// floats over a spinner or an empty state. Once visible it stays until
// dismissed, even if `enabled` flickers during a refetch.
export function useHint(id: HintId, enabled: boolean) {
  const [visible, setVisible] = useState(false);
  // True when NO hint has been seen or skipped yet — the first hint a
  // player ever meets is the one that offers "skip the tips".
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    if (!enabled || visible) return;
    let cancelled = false;
    (async () => {
      try {
        const [skipped, seen] = await Promise.all([
          AsyncStorage.getItem(SKIP_KEY),
          readSeen(),
        ]);
        if (cancelled || skipped === '1' || seen[id]) return;
        setIsFirst(Object.keys(seen).length === 0);
        setVisible(true);
      } catch {
        // Can't read storage → never nag.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, enabled, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markHintSeen(id);
  }, [id]);

  const skipAll = useCallback(() => {
    setVisible(false);
    skipAllHints();
  }, []);

  return { visible, isFirst, dismiss, skipAll };
}

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { useAuth } from './auth/AuthProvider';

// One heartbeat per hour is plenty for DAU/retention math, and a missed
// beat is fine — the throttle is deliberately just an in-memory
// timestamp, so a cold start always sends one.
const HEARTBEAT_MIN_INTERVAL_MS = 60 * 60 * 1000;

// Stamps profiles.last_active_at whenever the app becomes active with a
// signed-in user: once on launch/sign-in (the initial mount never gets
// an AppState 'active' transition), then on each return from background.
// Fire-and-forget — the UI never waits on it.
export function useActivityHeartbeat(): void {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const lastBeatAt = useRef(0);

  useEffect(() => {
    if (!userId) return;

    const beat = () => {
      const now = Date.now();
      if (now - lastBeatAt.current < HEARTBEAT_MIN_INTERVAL_MS) return;
      lastBeatAt.current = now;
      supabase.rpc('touch_last_active').then(({ error }) => {
        if (error) console.warn('[activity] heartbeat failed:', error.message);
      });
    };

    beat();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') beat();
    });
    return () => subscription.remove();
  }, [userId]);
}

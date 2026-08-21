import { router, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../supabase';

// Push payloads carry a `deep_link` field like "pindr:///chat/<id>" or
// "pindr:///rounds/<id>?requests=1". Convert that to an expo-router path
// and navigate. Query params are preserved since some targets may want
// them, but stripped cleanly if the route doesn't know about them.
function deepLinkToRoute(link: unknown): string | null {
  if (typeof link !== 'string' || link.length === 0) return null;
  // "pindr:///chat/abc" → "/chat/abc"; "pindr://chat/abc" → "/chat/abc"
  const withoutScheme = link.replace(/^pindr:\/\/\/?/, '');
  if (!withoutScheme) return null;
  return withoutScheme.startsWith('/') ? withoutScheme : `/${withoutScheme}`;
}

function routeFromResponse(
  response: Notifications.NotificationResponse | null | undefined,
): string | null {
  const data = response?.notification?.request?.content?.data as
    | Record<string, unknown>
    | undefined;
  return deepLinkToRoute(data?.deep_link);
}

// A tap counts as an open even when the deep link is missing or broken.
// The payload's log_id is the notifications_log row id (added by the
// Edge Functions' notifyUser); the RPC only sets opened_at if it's
// still null, so cold-start replays of an already-handled tap are
// no-ops. Fire-and-forget — navigation never waits on it.
function markOpenedFromResponse(
  response: Notifications.NotificationResponse | null | undefined,
): void {
  const data = response?.notification?.request?.content?.data as
    | Record<string, unknown>
    | undefined;
  const logId = data?.log_id;
  if (typeof logId !== 'string' || logId.length === 0) return;
  supabase
    .rpc('mark_notification_opened', { p_notification_id: logId })
    .then(({ error }) => {
      if (error) console.warn('[push] mark opened failed:', error.message);
    });
}

// A broken deep link must never take down the launch — landing on the
// default screen beats a frozen one.
function safePush(route: string): void {
  try {
    router.push(route as never);
  } catch (err) {
    console.warn(
      '[push] deep-link navigation failed:',
      (err as Error).message,
    );
  }
}

// Installs both paths that matter for routing:
//   1. addNotificationResponseReceivedListener — user taps a push while
//      the app is already running (background or foreground).
//   2. getLastNotificationResponseAsync — the tap that launched the app
//      from a cold start; response is already waiting when we mount.
//
// Cold-start taps arrive before the root navigator is mounted and
// before the Supabase session is restored, so responses are buffered
// until both are ready — navigating earlier throws and can strand the
// app on the splash screen, and the opened-at RPC would fire without a
// session. On some SDK versions the launching tap is delivered through
// BOTH paths, so responses are deduped by notification identifier.
export function usePushDeepLinking(): void {
  const { loading: authLoading } = useAuth();
  const navState = useRootNavigationState();
  const ready = !authLoading && Boolean(navState?.key);

  const readyRef = useRef(ready);
  readyRef.current = ready;
  const pending = useRef<Notifications.NotificationResponse[]>([]);
  const handledIds = useRef<Set<string>>(new Set());
  const coldStartChecked = useRef(false);

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse | null | undefined) => {
      if (!response) return;
      const id = response.notification?.request?.identifier;
      if (typeof id === 'string' && id.length > 0) {
        if (handledIds.current.has(id)) return;
        handledIds.current.add(id);
      }
      if (readyRef.current) {
        markOpenedFromResponse(response);
        const route = routeFromResponse(response);
        if (route) safePush(route);
      } else {
        pending.current.push(response);
      }
    },
    [],
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );

    if (!coldStartChecked.current) {
      coldStartChecked.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then(handleResponse)
        .catch(() => {});
    }

    return () => subscription.remove();
  }, [handleResponse]);

  // Flush anything that arrived before the app was ready to route.
  useEffect(() => {
    if (!ready || pending.current.length === 0) return;
    const queued = pending.current;
    pending.current = [];
    for (const response of queued) {
      markOpenedFromResponse(response);
      const route = routeFromResponse(response);
      if (route) safePush(route);
    }
  }, [ready]);
}

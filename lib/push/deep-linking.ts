import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
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

// Installs both listeners that matter for routing:
//   1. addNotificationResponseReceivedListener — user taps a push while
//      the app is already running (background or foreground).
//   2. getLastNotificationResponseAsync — the tap that launched the app
//      from a cold start; response is already waiting when we mount.
export function usePushDeepLinking(): void {
  const coldStartHandled = useRef(false);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        markOpenedFromResponse(response);
        const route = routeFromResponse(response);
        if (route) router.push(route as never);
      },
    );

    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      Notifications.getLastNotificationResponseAsync().then((response) => {
        markOpenedFromResponse(response);
        const route = routeFromResponse(response);
        if (route) router.push(route as never);
      });
    }

    return () => subscription.remove();
  }, []);
}

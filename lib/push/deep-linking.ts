import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

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
        const route = routeFromResponse(response);
        if (route) router.push(route as never);
      },
    );

    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      Notifications.getLastNotificationResponseAsync().then((response) => {
        const route = routeFromResponse(response);
        if (route) router.push(route as never);
      });
    }

    return () => subscription.remove();
  }, []);
}

// Thin wrapper over the Expo Push API. One message per token. No retries
// at V1 — the first response is authoritative. If EXPO_ACCESS_TOKEN is set
// in the Edge Function secrets, it's attached as a bearer token and the
// send bypasses Expo's anonymous rate limits.
//
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string; // Android
  _contentAvailable?: boolean;
  _displayInForeground?: boolean;
  interruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
};

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: Record<string, unknown> };

export type SendResult =
  | { ok: true; ticket: ExpoPushTicket }
  | { ok: false; error: string };

export async function sendExpoPush(
  message: ExpoPushMessage,
): Promise<SendResult> {
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  const headers: Record<string, string> = {
    'accept': 'application/json',
    'accept-encoding': 'gzip, deflate',
    'content-type': 'application/json',
  };
  if (accessToken) {
    headers['authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `expo_push_http_${response.status}: ${await response.text()}`,
      };
    }
    const json = (await response.json()) as { data: ExpoPushTicket };
    return { ok: true, ticket: json.data };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

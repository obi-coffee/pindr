// Shared "push to one user" routine. Every send path calls notifyUser.
// Step 6 will retrofit rate limit, quiet hours, and per-category cooldowns
// into this single function so all paths pick it up at once.

import { sendExpoPush } from './expo-push.ts';
import { getSupabaseAdmin } from './supabase-admin.ts';
import type { PushCopy } from './push-copy.ts';

export type NotificationCategory = 'matches' | 'messages' | 'rounds';

export type NotifyInput = {
  userId: string;
  eventType: string;
  category: NotificationCategory;
  copy: PushCopy;
  extraPayload?: Record<string, unknown>;
  iosInterruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
};

type LogStatus = 'sent' | 'failed';

async function writeLog(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>,
  status: LogStatus,
  error?: string,
) {
  const admin = getSupabaseAdmin();
  await admin.from('notifications_log').insert({
    user_id: userId,
    event_type: eventType,
    payload,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error: error ?? null,
  });
}

export async function notifyUser(input: NotifyInput): Promise<void> {
  const admin = getSupabaseAdmin();
  const logPayload = {
    ...input.copy,
    ...(input.extraPayload ?? {}),
  };

  const [{ data: prefs }, { data: tokens }] = await Promise.all([
    admin
      .from('notification_preferences')
      .select(input.category)
      .eq('user_id', input.userId)
      .maybeSingle(),
    admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', input.userId),
  ]);

  const categoryEnabled = prefs
    ? (prefs as Record<string, unknown>)[input.category] !== false
    : true;
  if (!categoryEnabled) {
    await writeLog(input.userId, input.eventType, logPayload, 'failed', 'category_disabled');
    return;
  }

  if (!tokens || tokens.length === 0) {
    await writeLog(input.userId, input.eventType, logPayload, 'failed', 'no_tokens');
    return;
  }

  const results = await Promise.all(
    tokens.map((row) =>
      sendExpoPush({
        to: (row as { token: string }).token,
        title: input.copy.title,
        body: input.copy.body,
        data: {
          deep_link: input.copy.deepLink,
          event_type: input.eventType,
          ...(input.extraPayload ?? {}),
        },
        priority: 'high',
        interruptionLevel: input.iosInterruptionLevel ?? 'active',
        channelId: 'default',
      }),
    ),
  );

  const transportFailure = results.find((r) => !r.ok);
  if (transportFailure && !transportFailure.ok) {
    await writeLog(input.userId, input.eventType, logPayload, 'failed', transportFailure.error);
    return;
  }
  const ticketError = results
    .map((r) => (r.ok ? r.ticket : null))
    .find((t) => t && t.status === 'error');
  if (ticketError && ticketError.status === 'error') {
    await writeLog(input.userId, input.eventType, logPayload, 'failed', ticketError.message);
    return;
  }

  await writeLog(input.userId, input.eventType, logPayload, 'sent');
}

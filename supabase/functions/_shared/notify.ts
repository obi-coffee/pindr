// Shared "push to one user" routine. Every send path calls notifyUser.
// Plan §2 rules (rate limit, quiet hours) are enforced here so every
// path inherits them automatically.
//
// Order of checks before calling Expo:
//   1. category enabled in notification_preferences
//   2. in quiet hours → write status='queued'; drainer handles later
//   3. over 24h rate limit → write status='failed', error='rate_limited'
//      (unless caller passes bypassRateLimit, used for mid-conversation
//       messages per plan §2)
//   4. no tokens registered → write status='failed', error='no_tokens'
// Otherwise: send, log as 'sent' / 'failed' with Expo error.

import { sendExpoPush } from './expo-push.ts';
import { getSupabaseAdmin } from './supabase-admin.ts';
import { isInQuietHours } from './quiet-hours.ts';
import type { PushCopy } from './push-copy.ts';

export type NotificationCategory = 'matches' | 'messages' | 'rounds';

export type NotifyInput = {
  userId: string;
  eventType: string;
  category: NotificationCategory;
  copy: PushCopy;
  extraPayload?: Record<string, unknown>;
  iosInterruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
  // Opt out of the 24h rate limit. Used by the messages path when the
  // recipient is mid-conversation (plan §2 exemption).
  bypassRateLimit?: boolean;
};

type LogStatus = 'sent' | 'failed' | 'queued';

const RATE_LIMIT_WINDOW_HOURS = 24;
const RATE_LIMIT_MAX = 5;

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

async function countSentInLast24h(userId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 3600 * 1000)
    .toISOString();
  const { count } = await admin
    .from('notifications_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'sent')
    .gte('sent_at', since);
  return count ?? 0;
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
      .select('matches, messages, rounds, quiet_hours_start, quiet_hours_end, timezone')
      .eq('user_id', input.userId)
      .maybeSingle(),
    admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', input.userId),
  ]);

  const prefsRow = prefs as
    | {
        matches: boolean;
        messages: boolean;
        rounds: boolean;
        quiet_hours_start: string;
        quiet_hours_end: string;
        timezone: string | null;
      }
    | null;

  const categoryEnabled = prefsRow ? prefsRow[input.category] !== false : true;
  if (!categoryEnabled) {
    await writeLog(input.userId, input.eventType, logPayload, 'failed', 'category_disabled');
    return;
  }

  if (prefsRow) {
    const quiet = isInQuietHours({
      now: new Date(),
      quietHoursStart: prefsRow.quiet_hours_start,
      quietHoursEnd: prefsRow.quiet_hours_end,
      timezone: prefsRow.timezone,
    });
    if (quiet) {
      await writeLog(input.userId, input.eventType, logPayload, 'queued');
      return;
    }
  }

  if (!input.bypassRateLimit) {
    const sentRecently = await countSentInLast24h(input.userId);
    if (sentRecently >= RATE_LIMIT_MAX) {
      await writeLog(
        input.userId,
        input.eventType,
        logPayload,
        'failed',
        'rate_limited',
      );
      return;
    }
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

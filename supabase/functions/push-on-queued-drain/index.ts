// Scheduled Edge Function that drains queued pushes left by notifyUser
// when the recipient was in quiet hours at the time of the event. Runs
// hourly on top of the hour — fine granularity for "the start of the
// next non-quiet window" because the only default quiet-hour boundaries
// are on the hour.
//
// For each queued row:
//   1. Is the recipient still in quiet hours? → leave it alone for now.
//   2. Otherwise: re-check rate limit, fetch tokens, send via Expo,
//      flip status to 'sent'/'failed'. Conditional update on id+status
//      keeps concurrent drain runs idempotent.

import { sendExpoPush } from '../_shared/expo-push.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { isInQuietHours } from '../_shared/quiet-hours.ts';

const RATE_LIMIT_WINDOW_HOURS = 24;
const RATE_LIMIT_MAX = 5;
const MAX_ROWS_PER_RUN = 500;
// Skip rows older than ~36h — they're stale and probably should be
// dropped rather than surfacing as a delayed lock-screen push.
const STALE_AFTER_HOURS = 36;

type QueuedRow = {
  id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type PrefsRow = {
  matches: boolean;
  messages: boolean;
  rounds: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string | null;
};

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

async function finalize(
  id: string,
  status: 'sent' | 'failed',
  error: string | null,
): Promise<void> {
  const admin = getSupabaseAdmin();
  // Conditional update guards against two concurrent drains racing on
  // the same row — only the first flip out of 'queued' wins.
  await admin
    .from('notifications_log')
    .update({
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      error,
    })
    .eq('id', id)
    .eq('status', 'queued');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const admin = getSupabaseAdmin();

  const staleCutoff = new Date(
    Date.now() - STALE_AFTER_HOURS * 3600 * 1000,
  ).toISOString();

  const { data: queued, error } = await admin
    .from('notifications_log')
    .select('id, user_id, event_type, payload, created_at')
    .eq('status', 'queued')
    .gte('created_at', staleCutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_ROWS_PER_RUN);

  if (error) {
    return new Response(`queued query failed: ${error.message}`, { status: 500 });
  }

  const rows = (queued ?? []) as QueuedRow[];

  // Group by user so we fetch prefs + tokens once per recipient.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [{ data: prefs }, { data: tokens }] = await Promise.all([
    admin
      .from('notification_preferences')
      .select('user_id, matches, messages, rounds, quiet_hours_start, quiet_hours_end, timezone')
      .in('user_id', userIds),
    admin
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', userIds),
  ]);

  const prefsByUser = new Map<string, PrefsRow>();
  for (const row of prefs ?? []) {
    const rec = row as PrefsRow & { user_id: string };
    prefsByUser.set(rec.user_id, rec);
  }
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokens ?? []) {
    const rec = row as { user_id: string; token: string };
    const list = tokensByUser.get(rec.user_id) ?? [];
    list.push(rec.token);
    tokensByUser.set(rec.user_id, list);
  }

  let drained = 0;
  let stillQuiet = 0;
  let failed = 0;

  for (const row of rows) {
    const prefsRow = prefsByUser.get(row.user_id);

    // Preferences row should always exist via trigger, but defensive.
    if (!prefsRow) {
      await finalize(row.id, 'failed', 'preferences_missing');
      failed += 1;
      continue;
    }

    if (
      isInQuietHours({
        now: new Date(),
        quietHoursStart: prefsRow.quiet_hours_start,
        quietHoursEnd: prefsRow.quiet_hours_end,
        timezone: prefsRow.timezone,
      })
    ) {
      stillQuiet += 1;
      continue;
    }

    const sentRecently = await countSentInLast24h(row.user_id);
    if (sentRecently >= RATE_LIMIT_MAX) {
      await finalize(row.id, 'failed', 'rate_limited');
      failed += 1;
      continue;
    }

    const userTokens = tokensByUser.get(row.user_id) ?? [];
    if (userTokens.length === 0) {
      await finalize(row.id, 'failed', 'no_tokens');
      failed += 1;
      continue;
    }

    const payload = row.payload ?? {};
    const title = (payload.title as string) ?? '';
    const body = (payload.body as string) ?? '';
    const deepLink = (payload.deepLink as string) ?? null;

    const results = await Promise.all(
      userTokens.map((token) =>
        sendExpoPush({
          to: token,
          title,
          body,
          data: { ...payload, event_type: row.event_type, deep_link: deepLink },
          priority: 'high',
          interruptionLevel: 'active',
          channelId: 'default',
        }),
      ),
    );

    const transportFailure = results.find((r) => !r.ok);
    if (transportFailure && !transportFailure.ok) {
      await finalize(row.id, 'failed', transportFailure.error);
      failed += 1;
      continue;
    }
    const ticketError = results
      .map((r) => (r.ok ? r.ticket : null))
      .find((t) => t && t.status === 'error');
    if (ticketError && ticketError.status === 'error') {
      await finalize(row.id, 'failed', ticketError.message);
      failed += 1;
      continue;
    }

    await finalize(row.id, 'sent', null);
    drained += 1;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      inspected: rows.length,
      drained,
      still_quiet: stillQuiet,
      failed,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
});

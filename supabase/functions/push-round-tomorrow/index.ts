// Scheduled Edge Function invoked hourly by pg_cron. Finds rounds teeing
// off 23–25 hours from now and pushes each joined user (host + accepted
// requesters) a §5.7 reminder. Plan §2 is strict: ONE reminder per round
// ever — enforced here by deduping against notifications_log before every
// push.
//
// No webhook payload; cron just pings this endpoint.

import { roundTomorrowCopy } from '../_shared/push-copy.ts';
import { formatClockLabel } from '../_shared/format.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

async function hasAlreadyReminded(
  userId: string,
  roundId: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('notifications_log')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'round_tomorrow')
    .eq('payload->>round_id', roundId)
    .limit(1);
  return Boolean(data && data.length > 0);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const admin = getSupabaseAdmin();

  const nowIso = new Date().toISOString();
  const windowStart = new Date(Date.now() + 23 * 3600 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 25 * 3600 * 1000).toISOString();

  const { data: rounds, error } = await admin
    .from('rounds')
    .select('id, host_user_id, course_id, tee_time, status')
    .in('status', ['open', 'full'])
    .gte('tee_time', windowStart)
    .lte('tee_time', windowEnd);

  if (error) {
    return new Response(`rounds query failed: ${error.message}`, { status: 500 });
  }

  let sent = 0;
  let skippedDedup = 0;

  for (const round of rounds ?? []) {
    const roundId = round.id as string;
    const hostId = round.host_user_id as string;
    const teeTimeIso = round.tee_time as string;
    const courseId = round.course_id as string;

    const [{ data: course }, { data: accepted }] = await Promise.all([
      admin.from('courses').select('name').eq('id', courseId).maybeSingle(),
      admin
        .from('round_requests')
        .select('requesting_user_id')
        .eq('round_id', roundId)
        .eq('status', 'accepted'),
    ]);

    const userIds = new Set<string>([hostId]);
    for (const row of accepted ?? []) {
      const id = (row as { requesting_user_id: string }).requesting_user_id;
      if (id) userIds.add(id);
    }

    const { data: prefs } = await admin
      .from('notification_preferences')
      .select('user_id, timezone')
      .in('user_id', Array.from(userIds));
    const tzByUser = new Map<string, string | null>();
    for (const row of prefs ?? []) {
      const rec = row as { user_id: string; timezone: string | null };
      tzByUser.set(rec.user_id, rec.timezone);
    }

    const courseName = (course?.name as string | null) ?? 'your course';

    for (const userId of userIds) {
      if (await hasAlreadyReminded(userId, roundId)) {
        skippedDedup += 1;
        continue;
      }
      const copy = roundTomorrowCopy({
        courseName,
        teeTimeClockLabel: formatClockLabel(
          teeTimeIso,
          tzByUser.get(userId) ?? null,
        ),
        roundId,
      });
      await notifyUser({
        userId,
        eventType: 'round_tomorrow',
        category: 'rounds',
        copy,
        extraPayload: { round_id: roundId },
      });
      sent += 1;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      ran_at: nowIso,
      rounds_in_window: rounds?.length ?? 0,
      sent,
      skipped_dedup: skippedDedup,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
});

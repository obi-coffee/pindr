// Scheduled Edge Function invoked hourly by pg_cron. Finds LOCKED rounds
// (origin_match_id set) whose tee time was 14–38 hours ago and nudges each
// player who hasn't checked in yet with §5.11 copy. One check-in push per
// round per user ever — deduped against notifications_log, same rule as
// the 24h reminder. Cancelled rounds never prompt.
//
// No webhook payload; cron just pings this endpoint.

import { roundCheckinCopy } from '../_shared/push-copy.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

async function hasAlreadyPrompted(
  userId: string,
  roundId: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('notifications_log')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'round_checkin')
    .eq('payload->>round_id', roundId)
    .limit(1);
  return Boolean(data && data.length > 0);
}

async function hasCheckedIn(userId: string, roundId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('round_checkins')
    .select('round_id')
    .eq('round_id', roundId)
    .eq('user_id', userId)
    .limit(1);
  return Boolean(data && data.length > 0);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const admin = getSupabaseAdmin();

  const nowIso = new Date().toISOString();
  const windowStart = new Date(Date.now() - 38 * 3600 * 1000).toISOString();
  const windowEnd = new Date(Date.now() - 14 * 3600 * 1000).toISOString();

  const { data: rounds, error } = await admin
    .from('rounds')
    .select('id, host_user_id, course_id, tee_time, status, origin_match_id')
    .eq('status', 'full')
    .not('origin_match_id', 'is', null)
    .gte('tee_time', windowStart)
    .lte('tee_time', windowEnd);

  if (error) {
    return new Response(`rounds query failed: ${error.message}`, { status: 500 });
  }

  let sent = 0;
  let skippedDedup = 0;
  let skippedCheckedIn = 0;

  for (const round of rounds ?? []) {
    const roundId = round.id as string;
    const hostId = round.host_user_id as string;
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

    const courseName = (course?.name as string | null) ?? 'your round';

    for (const userId of userIds) {
      if (await hasCheckedIn(userId, roundId)) {
        skippedCheckedIn += 1;
        continue;
      }
      if (await hasAlreadyPrompted(userId, roundId)) {
        skippedDedup += 1;
        continue;
      }
      const copy = roundCheckinCopy({ courseName });
      await notifyUser({
        userId,
        eventType: 'round_checkin',
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
      skipped_checked_in: skippedCheckedIn,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
});

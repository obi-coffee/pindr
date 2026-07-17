// Edge Function invoked on `rounds` update when status flips to
// 'cancelled'. Pushes every accepted requester (NOT the host — they're
// the one who cancelled) with §5.6 copy.

import { roundCancelledCopy } from '../_shared/push-copy.ts';
import { formatWeekdayLabel } from '../_shared/format.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type RoundRecord = {
  id: string;
  host_user_id: string;
  course_id: string;
  tee_time: string;
  status: string;
};

type WebhookPayload = {
  type: 'UPDATE';
  table: 'rounds';
  record: RoundRecord;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  let body: WebhookPayload;
  try {
    body = (await req.json()) as WebhookPayload;
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const round = body.record;
  if (!round?.id || !round.host_user_id || !round.course_id) {
    return new Response('missing round fields', { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const [{ data: host }, { data: course }, { data: accepted }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('display_name')
        .eq('user_id', round.host_user_id)
        .maybeSingle(),
      admin
        .from('courses')
        .select('name')
        .eq('id', round.course_id)
        .maybeSingle(),
      admin
        .from('round_requests')
        .select('requesting_user_id')
        .eq('round_id', round.id)
        .eq('status', 'accepted'),
    ]);

  const recipientIds = (accepted ?? [])
    .map((r) => (r as { requesting_user_id: string }).requesting_user_id)
    .filter((id): id is string => Boolean(id));

  if (recipientIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, recipients: 0 }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('user_id, timezone')
    .in('user_id', recipientIds);

  const tzByUser = new Map<string, string | null>();
  for (const row of prefs ?? []) {
    const rec = row as { user_id: string; timezone: string | null };
    tzByUser.set(rec.user_id, rec.timezone);
  }

  const hostDisplayName = (host?.display_name as string | null) ?? null;
  const courseName = (course?.name as string | null) ?? 'your course';

  await Promise.all(
    recipientIds.map((userId) => {
      const copy = roundCancelledCopy({
        hostDisplayName,
        courseName,
        weekdayLabel: formatWeekdayLabel(round.tee_time, tzByUser.get(userId) ?? null),
      });
      return notifyUser({
        userId,
        eventType: 'round_cancelled',
        category: 'rounds',
        copy,
        extraPayload: { round_id: round.id },
        // Plan §7: round-cancelled is time-sensitive on iOS.
        iosInterruptionLevel: 'time-sensitive',
      });
    }),
  );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

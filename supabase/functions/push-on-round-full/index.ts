// Edge Function invoked on `rounds` update when status flips to 'full'.
// Pushes the host AND every accepted requester with §5.5 copy.

import { roundFilledCopy } from '../_shared/push-copy.ts';
import { formatTeeTimeLabel } from '../_shared/format.ts';
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

  const [{ data: course }, { data: accepted }] = await Promise.all([
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

  const recipientIds = new Set<string>([round.host_user_id]);
  for (const row of accepted ?? []) {
    const id = (row as { requesting_user_id: string }).requesting_user_id;
    if (id) recipientIds.add(id);
  }

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('user_id, timezone')
    .in('user_id', Array.from(recipientIds));

  const tzByUser = new Map<string, string | null>();
  for (const row of prefs ?? []) {
    const rec = row as { user_id: string; timezone: string | null };
    tzByUser.set(rec.user_id, rec.timezone);
  }

  const courseName = (course?.name as string | null) ?? 'your course';

  await Promise.all(
    Array.from(recipientIds).map((userId) => {
      const copy = roundFilledCopy({
        courseName,
        teeTimeLabel: formatTeeTimeLabel(round.tee_time, tzByUser.get(userId) ?? null),
        roundId: round.id,
      });
      return notifyUser({
        userId,
        eventType: 'round_filled',
        category: 'rounds',
        copy,
        extraPayload: { round_id: round.id },
      });
    }),
  );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

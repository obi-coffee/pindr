// Edge Function invoked on `round_requests` update when status flips to
// 'accepted'. Pushes the requester with §5.4 copy. The trigger's WHEN
// clause guarantees we only see transitions to accepted, so no status
// check is needed here.

import { roundAcceptedCopy } from '../_shared/push-copy.ts';
import { formatTeeTimeLabel } from '../_shared/format.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type RoundRequestRecord = {
  id: string;
  round_id: string;
  requesting_user_id: string;
  status: string;
  responded_at: string | null;
};

type WebhookPayload = {
  type: 'UPDATE';
  table: 'round_requests';
  record: RoundRequestRecord;
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

  const request = body.record;
  if (!request?.id || !request.round_id || !request.requesting_user_id) {
    return new Response('missing request fields', { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: round } = await admin
    .from('rounds')
    .select('id, host_user_id, course_id, tee_time')
    .eq('id', request.round_id)
    .maybeSingle();

  if (!round) {
    return new Response('round not found', { status: 404 });
  }

  const [{ data: host }, { data: course }, { data: requesterPrefs }] =
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
        .from('notification_preferences')
        .select('timezone')
        .eq('user_id', request.requesting_user_id)
        .maybeSingle(),
    ]);

  const copy = roundAcceptedCopy({
    hostDisplayName: (host?.display_name as string | null) ?? null,
    courseName: (course?.name as string | null) ?? 'your course',
    teeTimeLabel: formatTeeTimeLabel(
      round.tee_time as string,
      (requesterPrefs?.timezone as string | null) ?? null,
    ),
    roundId: round.id as string,
  });

  await notifyUser({
    userId: request.requesting_user_id,
    eventType: 'round_request_accepted',
    category: 'rounds',
    copy,
    extraPayload: {
      round_id: round.id,
      request_id: request.id,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

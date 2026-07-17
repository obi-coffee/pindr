// Edge Function invoked by the announce_arrival RPC. The arriver tapped
// "i'm here" — push the OTHER player in the locked round with §5.12 copy.
// Bypasses quiet hours (the only event that does, per plan §5.12) and
// rides as time-sensitive. One ping per round per arriver, deduped
// against notifications_log.

import { arrivalCopy } from '../_shared/push-copy.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type ArrivalRecord = {
  round_id: string;
  arriver_id: string;
};

type WebhookPayload = {
  type: 'ARRIVAL';
  table: 'rounds';
  record: ArrivalRecord;
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

  const arrival = body.record;
  if (!arrival?.round_id || !arrival.arriver_id) {
    return new Response('missing arrival fields', { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: round } = await admin
    .from('rounds')
    .select('id, host_user_id, course_id, origin_match_id')
    .eq('id', arrival.round_id)
    .maybeSingle();

  if (!round || !round.origin_match_id) {
    return new Response('locked round not found', { status: 404 });
  }

  const { data: match } = await admin
    .from('matches')
    .select('user_a_id, user_b_id')
    .eq('id', round.origin_match_id as string)
    .maybeSingle();

  if (!match) {
    return new Response('match not found', { status: 404 });
  }

  const recipientId =
    (match.user_a_id as string) === arrival.arriver_id
      ? (match.user_b_id as string)
      : (match.user_a_id as string);

  // One ping per round per arriver, ever.
  const { data: prior } = await admin
    .from('notifications_log')
    .select('id')
    .eq('user_id', recipientId)
    .eq('event_type', 'round_arrival')
    .eq('payload->>round_id', round.id as string)
    .eq('payload->>arriver_id', arrival.arriver_id)
    .limit(1);
  if (prior && prior.length > 0) {
    return new Response(JSON.stringify({ ok: true, deduped: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const [{ data: arriver }, { data: course }] = await Promise.all([
    admin
      .from('profiles')
      .select('display_name')
      .eq('user_id', arrival.arriver_id)
      .maybeSingle(),
    admin
      .from('courses')
      .select('name')
      .eq('id', round.course_id as string)
      .maybeSingle(),
  ]);

  const copy = arrivalCopy({
    arriverDisplayName: (arriver?.display_name as string | null) ?? null,
    courseName: (course?.name as string | null) ?? 'the course',
    roundId: round.id as string,
  });

  await notifyUser({
    userId: recipientId,
    eventType: 'round_arrival',
    category: 'rounds',
    copy,
    iosInterruptionLevel: 'time-sensitive',
    bypassQuietHours: true,
    extraPayload: {
      round_id: round.id,
      arriver_id: arrival.arriver_id,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

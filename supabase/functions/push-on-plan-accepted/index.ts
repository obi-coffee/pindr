// Edge Function invoked on `round_plans` update when status flips to
// 'accepted'. The accepter is the non-proposer match member; push the
// PROPOSER with §5.10 copy. The trigger's WHEN clause guarantees we only
// see transitions to accepted.

import { planAcceptedCopy } from '../_shared/push-copy.ts';
import { formatTeeTimeLabel } from '../_shared/format.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type RoundPlanRecord = {
  id: string;
  match_id: string;
  proposer_id: string;
  course_id: string;
  tee_time: string;
  status: string;
  round_id: string | null;
};

type WebhookPayload = {
  type: 'UPDATE';
  table: 'round_plans';
  record: RoundPlanRecord;
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

  const plan = body.record;
  if (!plan?.id || !plan.match_id || !plan.proposer_id || !plan.course_id) {
    return new Response('missing plan fields', { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: match } = await admin
    .from('matches')
    .select('id, user_a_id, user_b_id')
    .eq('id', plan.match_id)
    .maybeSingle();

  if (!match) {
    return new Response('match not found', { status: 404 });
  }

  const accepterId =
    (match.user_a_id as string) === plan.proposer_id
      ? (match.user_b_id as string)
      : (match.user_a_id as string);

  const [{ data: accepter }, { data: course }, { data: proposerPrefs }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('display_name')
        .eq('user_id', accepterId)
        .maybeSingle(),
      admin
        .from('courses')
        .select('name')
        .eq('id', plan.course_id)
        .maybeSingle(),
      admin
        .from('notification_preferences')
        .select('timezone')
        .eq('user_id', plan.proposer_id)
        .maybeSingle(),
    ]);

  const copy = planAcceptedCopy({
    accepterDisplayName: (accepter?.display_name as string | null) ?? null,
    courseName: (course?.name as string | null) ?? 'a course',
    teeTimeLabel: formatTeeTimeLabel(
      plan.tee_time,
      (proposerPrefs?.timezone as string | null) ?? null,
    ),
    roundId: plan.round_id ?? '',
  });

  await notifyUser({
    userId: plan.proposer_id,
    eventType: 'round_plan_accepted',
    category: 'rounds',
    copy,
    extraPayload: {
      plan_id: plan.id,
      match_id: plan.match_id,
      round_id: plan.round_id,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

// Edge Function invoked on `round_plans` insert. A plan was proposed
// inside a match chat; push the OTHER member of the match with §5.9 copy.
// The trigger's WHEN clause guarantees status = 'proposed'.

import { planProposedCopy } from '../_shared/push-copy.ts';
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
};

type WebhookPayload = {
  type: 'INSERT';
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

  const recipientId =
    (match.user_a_id as string) === plan.proposer_id
      ? (match.user_b_id as string)
      : (match.user_a_id as string);

  const [{ data: proposer }, { data: course }, { data: recipientPrefs }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('display_name')
        .eq('user_id', plan.proposer_id)
        .maybeSingle(),
      admin
        .from('courses')
        .select('name')
        .eq('id', plan.course_id)
        .maybeSingle(),
      admin
        .from('notification_preferences')
        .select('timezone')
        .eq('user_id', recipientId)
        .maybeSingle(),
    ]);

  const copy = planProposedCopy({
    proposerDisplayName: (proposer?.display_name as string | null) ?? null,
    courseName: (course?.name as string | null) ?? 'a course',
    teeTimeLabel: formatTeeTimeLabel(
      plan.tee_time,
      (recipientPrefs?.timezone as string | null) ?? null,
    ),
    matchId: plan.match_id,
  });

  await notifyUser({
    userId: recipientId,
    eventType: 'round_plan_proposed',
    category: 'rounds',
    copy,
    extraPayload: {
      plan_id: plan.id,
      match_id: plan.match_id,
      proposer_id: plan.proposer_id,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

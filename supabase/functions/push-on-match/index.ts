// Edge Function invoked on `matches` insert. Fans out a push to both users
// using plan §5.1 copy. One call per registered token per user; outcome
// written to `notifications_log`.
//
// Rate limit, quiet hours, and per-category cooldowns are intentionally
// NOT enforced here — they're retrofitted as shared middleware in Step 6
// of Phase 5c. Only the `notification_preferences.matches` category
// toggle is honored at this stage.

import { matchCopy } from '../_shared/push-copy.ts';
import { sendExpoPush } from '../_shared/expo-push.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type MatchRecord = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
};

type WebhookPayload = {
  type: 'INSERT';
  table: 'matches';
  record: MatchRecord;
};

type LogStatus = 'sent' | 'failed';

async function logPush(
  userId: string,
  payload: Record<string, unknown>,
  status: LogStatus,
  error?: string,
) {
  const admin = getSupabaseAdmin();
  await admin.from('notifications_log').insert({
    user_id: userId,
    event_type: 'new_match',
    payload,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error: error ?? null,
  });
}

async function pushMatchToUser(params: {
  userId: string;
  otherUserId: string;
  matchId: string;
}) {
  const admin = getSupabaseAdmin();

  const [{ data: prefs }, { data: otherProfile }, { data: tokens }] =
    await Promise.all([
      admin
        .from('notification_preferences')
        .select('matches')
        .eq('user_id', params.userId)
        .maybeSingle(),
      admin
        .from('profiles')
        .select('display_name')
        .eq('user_id', params.otherUserId)
        .maybeSingle(),
      admin
        .from('push_tokens')
        .select('token')
        .eq('user_id', params.userId),
    ]);

  const copy = matchCopy({
    otherDisplayName: otherProfile?.display_name ?? null,
    matchId: params.matchId,
  });
  const payload = { ...copy, match_id: params.matchId, other_user_id: params.otherUserId };

  if (prefs && prefs.matches === false) {
    await logPush(params.userId, payload, 'failed', 'category_disabled');
    return;
  }

  if (!tokens || tokens.length === 0) {
    await logPush(params.userId, payload, 'failed', 'no_tokens');
    return;
  }

  const results = await Promise.all(
    tokens.map((row) =>
      sendExpoPush({
        to: row.token as string,
        title: copy.title,
        body: copy.body,
        data: { deep_link: copy.deepLink, event_type: 'new_match', match_id: params.matchId },
        priority: 'high',
        interruptionLevel: 'active',
        channelId: 'default',
      }),
    ),
  );

  const firstFailure = results.find((r) => !r.ok);
  if (firstFailure && !firstFailure.ok) {
    await logPush(params.userId, payload, 'failed', firstFailure.error);
    return;
  }
  const errorTicket = results
    .map((r) => (r.ok ? r.ticket : null))
    .find((t) => t && t.status === 'error');
  if (errorTicket && errorTicket.status === 'error') {
    await logPush(params.userId, payload, 'failed', errorTicket.message);
    return;
  }

  await logPush(params.userId, payload, 'sent');
}

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

  const match = body.record;
  if (!match?.id || !match.user_a_id || !match.user_b_id) {
    return new Response('missing match fields', { status: 400 });
  }

  await Promise.all([
    pushMatchToUser({
      userId: match.user_a_id,
      otherUserId: match.user_b_id,
      matchId: match.id,
    }),
    pushMatchToUser({
      userId: match.user_b_id,
      otherUserId: match.user_a_id,
      matchId: match.id,
    }),
  ]);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

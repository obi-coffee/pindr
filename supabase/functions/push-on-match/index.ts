// Edge Function invoked on `matches` insert. Fans out a push to both
// users using plan §5.1 copy. Per-user delivery logic lives in
// _shared/notify.ts so every send path behaves identically.

import { matchCopy } from '../_shared/push-copy.ts';
import { notifyUser } from '../_shared/notify.ts';
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

async function pushMatchToUser(params: {
  userId: string;
  otherUserId: string;
  matchId: string;
}) {
  const admin = getSupabaseAdmin();
  const { data: otherProfile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('user_id', params.otherUserId)
    .maybeSingle();

  const copy = matchCopy({
    otherDisplayName: (otherProfile?.display_name as string | null) ?? null,
    matchId: params.matchId,
  });

  await notifyUser({
    userId: params.userId,
    eventType: 'new_match',
    category: 'matches',
    copy,
    extraPayload: { match_id: params.matchId, other_user_id: params.otherUserId },
  });
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

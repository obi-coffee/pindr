// Edge Function invoked on `messages` insert. Looks up the parent match
// to find the recipient (the user in user_a_id/user_b_id that isn't the
// sender), skips pushing the sender, and calls notifyUser.

import { messageCopy } from '../_shared/push-copy.ts';
import { notifyUser } from '../_shared/notify.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

type MessageRecord = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type WebhookPayload = {
  type: 'INSERT';
  table: 'messages';
  record: MessageRecord;
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

  const message = body.record;
  if (!message?.id || !message.match_id || !message.sender_id) {
    return new Response('missing message fields', { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: match } = await admin
    .from('matches')
    .select('id, user_a_id, user_b_id')
    .eq('id', message.match_id)
    .maybeSingle();

  if (!match) {
    return new Response('match not found', { status: 404 });
  }

  const recipientId =
    match.user_a_id === message.sender_id ? match.user_b_id : match.user_a_id;

  const { data: senderProfile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('user_id', message.sender_id)
    .maybeSingle();

  const copy = messageCopy({
    senderDisplayName: (senderProfile?.display_name as string | null) ?? null,
    messageBody: message.body,
    matchId: message.match_id,
  });

  await notifyUser({
    userId: recipientId as string,
    eventType: 'new_message',
    category: 'messages',
    copy,
    extraPayload: {
      match_id: message.match_id,
      message_id: message.id,
      sender_id: message.sender_id,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

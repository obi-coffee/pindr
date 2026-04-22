// Edge Function invoked on `messages` insert. Looks up the parent match
// to find the recipient (the user in user_a_id/user_b_id that isn't the
// sender), skips pushing the sender, and calls notifyUser.
//
// Two message-specific rules from plan §2, enforced here (not in the
// shared notify):
//
//   - Same-sender cooldown: no more than 3 "new_message" pushes from the
//     same sender per hour. A fourth is logged with status='failed',
//     error='message_same_sender_cooldown' and skipped.
//   - Mid-conversation exemption: if the recipient has themselves sent a
//     message in this match within the last 30 minutes, pass
//     bypassRateLimit so the push isn't dropped by the 24h counter.

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

const SAME_SENDER_WINDOW_MS = 60 * 60 * 1000;
const SAME_SENDER_MAX = 3;
const MID_CONVERSATION_WINDOW_MS = 30 * 60 * 1000;

async function countRecentNewMessagePushesFromSender(
  recipientId: string,
  senderId: string,
): Promise<number> {
  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - SAME_SENDER_WINDOW_MS).toISOString();
  const { count } = await admin
    .from('notifications_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', recipientId)
    .eq('event_type', 'new_message')
    .eq('status', 'sent')
    .eq('payload->>sender_id', senderId)
    .gte('sent_at', since);
  return count ?? 0;
}

async function isRecipientMidConversation(
  matchId: string,
  recipientId: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - MID_CONVERSATION_WINDOW_MS).toISOString();
  const { data } = await admin
    .from('messages')
    .select('id')
    .eq('match_id', matchId)
    .eq('sender_id', recipientId)
    .gte('created_at', since)
    .limit(1);
  return Boolean(data && data.length > 0);
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

  const logPayload = {
    ...copy,
    match_id: message.match_id,
    message_id: message.id,
    sender_id: message.sender_id,
  };

  // Same-sender cooldown short-circuit.
  const recentFromSender = await countRecentNewMessagePushesFromSender(
    recipientId as string,
    message.sender_id,
  );
  if (recentFromSender >= SAME_SENDER_MAX) {
    await admin.from('notifications_log').insert({
      user_id: recipientId,
      event_type: 'new_message',
      payload: logPayload,
      status: 'failed',
      sent_at: null,
      error: 'message_same_sender_cooldown',
    });
    return new Response(JSON.stringify({ ok: true, skipped: 'cooldown' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const midConversation = await isRecipientMidConversation(
    message.match_id,
    recipientId as string,
  );

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
    bypassRateLimit: midConversation,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});

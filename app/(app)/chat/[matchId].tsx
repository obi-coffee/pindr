import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchMatchDetails,
  fetchMessages,
  markMatchRead,
  sendMessage,
  type ChatMessage,
  type MatchDetails,
} from '../../../lib/chat/queries';
import { openUserMenu } from '../../../lib/safety/menu';
import { supabase } from '../../../lib/supabase';

export default function ChatThread() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();

  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!matchId || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const [d, msgs] = await Promise.all([
          fetchMatchDetails(matchId, user.id),
          fetchMessages(matchId),
        ]);
        if (cancelled) return;
        setDetails(d);
        setMessages(msgs);
        await markMatchRead(matchId, user.id);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
          if (next.sender_id !== user.id) {
            markMatchRead(matchId, user.id).catch(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const onSend = useCallback(async () => {
    if (!matchId || !user) return;
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    try {
      const sent = await sendMessage(matchId, user.id, body);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      setError((err as Error).message);
      setDraft(body);
    } finally {
      setSending(false);
    }
  }, [draft, matchId, sending, user]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-sm text-red-500">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 active:opacity-70"
        >
          <Text className="text-sm text-slate-700">Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center border-b border-slate-100 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-2 h-9 w-9 items-center justify-center active:opacity-70"
        >
          <Text className="text-2xl text-slate-700">‹</Text>
        </Pressable>
        <View className="mr-3 h-10 w-10 overflow-hidden rounded-full bg-slate-100">
          {details?.other_photo_url ? (
            <Image
              source={{ uri: details.other_photo_url }}
              style={{ flex: 1 }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-base">⛳</Text>
            </View>
          )}
        </View>
        <Text className="flex-1 text-base font-semibold text-slate-900">
          {details?.other_display_name ?? 'Match'}
        </Text>
        {details?.other_user_id && user ? (
          <Pressable
            onPress={() =>
              openUserMenu({
                currentUserId: user.id,
                targetUserId: details.other_user_id,
                targetName: details.other_display_name,
                matchId: details.match_id,
                onBlocked: () => router.replace('/matches'),
              })
            }
            className="h-9 w-9 items-center justify-center active:opacity-70"
            hitSlop={8}
          >
            <Text className="text-xl text-slate-700">⋯</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        className="flex-1"
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <MessageBubble message={item} mine={item.sender_id === user?.id} />
          )}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={() => (
            <View className="mt-24 items-center px-6">
              <Text className="text-4xl">👋</Text>
              <Text className="mt-3 text-center text-sm text-slate-500">
                You matched. Send the first message.
              </Text>
            </View>
          )}
        />

        <View className="flex-row items-end gap-2 border-t border-slate-100 bg-white px-3 py-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor="#94a3b8"
            multiline
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900"
            style={{ maxHeight: 120 }}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            className={`rounded-full px-4 py-2 ${
              !draft.trim() || sending ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
            }`}
          >
            <Text className="text-sm font-semibold text-white">Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) {
  return (
    <View
      className={`mb-2 max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}
    >
      <View
        className={`rounded-2xl px-3 py-2 ${
          mine ? 'bg-emerald-600' : 'bg-slate-100'
        }`}
      >
        <Text className={mine ? 'text-white' : 'text-slate-900'}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

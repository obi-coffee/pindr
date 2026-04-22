import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonChatList } from '../../../components/lists/SkeletonChatList';
import {
  Typography,
  fontFamilyFor,
  radii,
  useTheme,
} from '../../../components/ui';
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
  const { colors } = useTheme();

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
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.paper,
        }}
      >
        <SkeletonChatList />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.paper,
          paddingHorizontal: 32,
        }}
      >
        <Typography
          variant="body"
          color="burgundy"
          style={{ textAlign: 'center' }}
        >
          {error}
        </Typography>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ marginTop: 16, paddingVertical: 8 }}
        >
          <Typography variant="caption" color="ink-subtle">
            back
          </Typography>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.stroke,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Typography variant="h2" color="ink">
            ‹
          </Typography>
        </Pressable>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: colors['paper-raised'],
            marginRight: 12,
          }}
        >
          {details?.other_photo_url ? (
            <Image
              source={{ uri: details.other_photo_url }}
              style={{ flex: 1 }}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <Typography variant="h3" style={{ flex: 1 }}>
          {details?.other_display_name ?? 'match'}
        </Typography>
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
            hitSlop={8}
            style={{
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" color="ink">
              ⋯
            </Typography>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          }}
          renderItem={({ item }) => (
            <MessageBubble message={item} mine={item.sender_id === user?.id} />
          )}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 120,
                alignItems: 'center',
                paddingHorizontal: 28,
              }}
            >
              <Typography
                variant="display-lg"
                style={{ textAlign: 'center' }}
              >
                you{'\n'}locked in.
              </Typography>
              <View style={{ height: 12 }} />
              <Typography
                variant="body"
                color="ink-soft"
                style={{ textAlign: 'center' }}
              >
                send the first message. keep it plain.
              </Typography>
            </View>
          )}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: colors.stroke,
            backgroundColor: colors.paper,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="say something…"
            placeholderTextColor={colors['ink-subtle']}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 40,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: colors['stroke-strong'],
              backgroundColor: colors['paper-high'],
              fontSize: 16,
              fontFamily: fontFamilyFor('400'),
              color: colors.ink,
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={{
              height: 40,
              paddingHorizontal: 18,
              borderRadius: radii.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                !draft.trim() || sending ? colors['ink-subtle'] : colors.ink,
              opacity: !draft.trim() || sending ? 0.6 : 1,
            }}
          >
            <Typography variant="caption" color="paper-high">
              send
            </Typography>
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
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginBottom: 8,
        maxWidth: '80%',
        alignSelf: mine ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 18,
          backgroundColor: mine ? colors.ink : colors['paper-raised'],
          borderWidth: mine ? 0 : 1,
          borderColor: colors.stroke,
        }}
      >
        <Typography variant="body-lg" color={mine ? 'paper-high' : 'ink'}>
          {message.body}
        </Typography>
      </View>
    </View>
  );
}

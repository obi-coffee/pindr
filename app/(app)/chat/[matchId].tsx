import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Hint } from '../../../components/Hint';
import { SkeletonChatList } from '../../../components/lists/SkeletonChatList';
import { FadeIn } from '../../../components/motion/FadeIn';
import { useToast } from '../../../components/motion/Toast';
import { PlanCard } from '../../../components/PlanCard';
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
import { useHaptics } from '../../../lib/haptics';
import { useHint } from '../../../lib/hints';
import {
  acceptPlan,
  cancelPlan,
  declinePlan,
  listPlans,
  type PlanWithCourse,
  type RoundPlanStatus,
} from '../../../lib/plans/queries';
import { availabilityShortLine } from '../../../lib/profile/availability';
import { openUserMenu } from '../../../lib/safety/menu';
import { supabase } from '../../../lib/supabase';

// The chat timeline interleaves two kinds of items: plain messages and
// round-plan cards, merged by created_at so a plan reads like part of
// the conversation.
type TimelineItem =
  | { kind: 'message'; key: string; created_at: string; message: ChatMessage }
  | { kind: 'plan'; key: string; created_at: string; plan: PlanWithCourse };

export default function ChatThread() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const haptics = useHaptics();

  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [plans, setPlans] = useState<PlanWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // First-run hint, once the conversation has actually loaded.
  const chatHint = useHint('chat', !loading && !error);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const listRef = useRef<FlatList<TimelineItem>>(null);

  useEffect(() => {
    if (!matchId || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const [d, msgs, planRows] = await Promise.all([
          fetchMatchDetails(matchId, user.id),
          fetchMessages(matchId),
          listPlans(matchId),
        ]);
        if (cancelled) return;
        setDetails(d);
        setMessages(msgs);
        setPlans(planRows);
        await markMatchRead(matchId, user.id);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const refreshPlans = () => {
      listPlans(matchId)
        .then((rows) => {
          if (!cancelled) setPlans(rows);
        })
        .catch(() => {});
    };

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'round_plans',
          filter: `match_id=eq.${matchId}`,
        },
        // The realtime payload has no joined course row, so refetch the
        // (short) plan list instead of patching state from the payload.
        refreshPlans,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'round_plans',
          filter: `match_id=eq.${matchId}`,
        },
        refreshPlans,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({
        kind: 'message' as const,
        key: `m-${m.id}`,
        created_at: m.created_at,
        message: m,
      })),
      ...plans.map((p) => ({
        kind: 'plan' as const,
        key: `p-${p.id}`,
        created_at: p.created_at,
        plan: p,
      })),
    ];
    items.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return items;
  }, [messages, plans]);

  useEffect(() => {
    if (timeline.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [timeline.length]);

  const patchPlan = useCallback(
    (planId: string, patch: Partial<PlanWithCourse>) => {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  // Optimistic accept: the card flips to "locked in" immediately; on
  // failure we revert and toast. Realtime's UPDATE event reconciles the
  // authoritative row (with round_id) either way.
  const handleAccept = useCallback(
    async (plan: PlanWithCourse) => {
      if (busyPlanId) return;
      setBusyPlanId(plan.id);
      const prevStatus: RoundPlanStatus = plan.status;
      patchPlan(plan.id, { status: 'accepted' });
      try {
        const roundId = await acceptPlan(plan.id);
        patchPlan(plan.id, { round_id: roundId });
        haptics.match();
      } catch (err) {
        patchPlan(plan.id, { status: prevStatus });
        showToast((err as Error).message, { variant: 'error' });
      } finally {
        setBusyPlanId(null);
      }
    },
    [busyPlanId, patchPlan, haptics, showToast],
  );

  const handleDecline = useCallback(
    async (plan: PlanWithCourse) => {
      if (busyPlanId) return;
      setBusyPlanId(plan.id);
      const prevStatus: RoundPlanStatus = plan.status;
      patchPlan(plan.id, { status: 'declined' });
      try {
        await declinePlan(plan.id);
      } catch {
        patchPlan(plan.id, { status: prevStatus });
        showToast("couldn't save that — mind trying again?", {
          variant: 'error',
        });
      } finally {
        setBusyPlanId(null);
      }
    },
    [busyPlanId, patchPlan, showToast],
  );

  const handleCancel = useCallback(
    async (plan: PlanWithCourse) => {
      if (busyPlanId) return;
      setBusyPlanId(plan.id);
      const prevStatus: RoundPlanStatus = plan.status;
      patchPlan(plan.id, { status: 'cancelled' });
      try {
        await cancelPlan(plan.id);
      } catch {
        patchPlan(plan.id, { status: prevStatus });
        showToast("couldn't save that — mind trying again?", {
          variant: 'error',
        });
      } finally {
        setBusyPlanId(null);
      }
    },
    [busyPlanId, patchPlan, showToast],
  );

  const handleViewRound = useCallback((plan: PlanWithCourse) => {
    if (plan.round_id) {
      router.push(`/rounds/${plan.round_id}` as never);
    }
  }, []);

  const onSend = useCallback(async () => {
    if (!matchId || !user) return;
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');

    // Optimistic: show the bubble at 0.6 opacity immediately, then
    // reconcile once the server confirms. Temp id is client-only and
    // gets swapped for the server id on success.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      body,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sent = await sendMessage(matchId, user.id, body);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === sent.id)) return withoutTemp;
        return [...withoutTemp, sent];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      showToast("couldn't save that — mind trying again?", {
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  }, [draft, matchId, sending, user, showToast]);

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
      <FadeIn style={{ flex: 1 }}>
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
        <View style={{ flex: 1 }}>
          <Typography variant="h3">
            {details?.other_display_name ?? 'match'}
          </Typography>
          {availabilityShortLine(details?.other_availability) ? (
            <Typography variant="body-sm" color="ink-soft" numberOfLines={1}>
              plays {availabilityShortLine(details?.other_availability)}
            </Typography>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push(`/plan/${matchId}` as never)}
          hitSlop={8}
          style={{
            height: 36,
            paddingHorizontal: 12,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: colors['stroke-strong'],
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Typography variant="caption" color="ink">
            plan a round
          </Typography>
        </Pressable>
        {details?.other_user_id && user ? (
          <Pressable
            onPress={() =>
              openUserMenu({
                currentUserId: user.id,
                targetUserId: details.other_user_id,
                targetName: details.other_display_name,
                matchId: details.match_id,
                toast: showToast,
                onBlocked: () => router.replace('/matches'),
                // Thread is already dismissed optimistically; on
                // server failure there's no UI to restore here. Toast
                // still fires from the menu.
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
          data={timeline}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          }}
          renderItem={({ item }) =>
            item.kind === 'message' ? (
              <MessageBubble
                message={item.message}
                mine={item.message.sender_id === user?.id}
              />
            ) : (
              <PlanCard
                plan={item.plan}
                mine={item.plan.proposer_id === user?.id}
                busy={busyPlanId === item.plan.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={handleCancel}
                onViewRound={handleViewRound}
              />
            )
          }
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
      </FadeIn>

      {chatHint.visible ? (
        <Hint
          text="when it clicks, lock in a round — right from here."
          showSkip={chatHint.isFirst}
          onDismiss={chatHint.dismiss}
          onSkipAll={chatHint.skipAll}
          // Drops in under the header, next to the lock-in button it
          // points at — and clear of the composer at the bottom.
          placement="top"
          offset={64}
        />
      ) : null}
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
        opacity: message._pending ? 0.6 : 1,
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

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, colors } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { fetchMatches, type MatchSummary } from '../../../lib/chat/queries';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchMatches();
      setMatches(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
        <Typography variant="h1">matches</Typography>
      </View>

      {loading && !refreshing ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Typography
            variant="body"
            color="burgundy"
            style={{ textAlign: 'center' }}
          >
            couldn't load your matches. check your signal and try again?
          </Typography>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.ink}
            />
          }
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 80,
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <Typography
                variant="display-lg"
                style={{ textAlign: 'center' }}
              >
                nobody{'\n'}locked in yet.
              </Typography>
              <View style={{ height: 12 }} />
              <Typography
                variant="body"
                color="ink-soft"
                style={{ textAlign: 'center' }}
              >
                lock in on someone from discover and they'll land here.
              </Typography>
            </View>
          )}
          renderItem={({ item }) => (
            <MatchRow match={item} myUserId={user?.id ?? null} />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.stroke,
                marginLeft: 90,
                marginRight: 20,
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function MatchRow({
  match,
  myUserId,
}: {
  match: MatchSummary;
  myUserId: string | null;
}) {
  const hasMessage = Boolean(match.last_message);
  const mine =
    hasMessage && match.last_message_sender_id === myUserId;
  const previewText = hasMessage
    ? mine
      ? `you: ${match.last_message}`
      : match.last_message!
    : 'say hi to start the conversation.';

  return (
    <Pressable
      onPress={() => router.push(`/chat/${match.match_id}` as never)}
      android_ripple={{ color: colors['paper-raised'] }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: colors['paper-raised'],
          marginRight: 14,
        }}
      >
        {match.other_photo_url ? (
          <Image
            source={{ uri: match.other_photo_url }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 3,
          }}
        >
          <Typography variant="h3" style={{ flex: 1, marginRight: 8 }}>
            {match.other_display_name ?? 'Unnamed'}
          </Typography>
          {match.last_message_at ? (
            <Typography variant="caption" color="ink-subtle">
              {formatRelative(match.last_message_at)}
            </Typography>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="body"
            color={hasMessage ? 'ink-soft' : 'ink-subtle'}
            numberOfLines={1}
            style={{
              flex: 1,
              marginRight: 8,
              fontStyle: hasMessage ? 'normal' : 'normal',
            }}
          >
            {previewText}
          </Typography>
          {match.unread_count > 0 ? (
            <UnreadBadge count={match.unread_count} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <View
      style={{
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 999,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="caption" color="paper-high">
        {count > 99 ? '99+' : String(count)}
      </Typography>
    </View>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  return `${weeks}w`;
}

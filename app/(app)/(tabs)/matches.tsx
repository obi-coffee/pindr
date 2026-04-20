import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMatches, type MatchSummary } from '../../../lib/chat/queries';

export default function Matches() {
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pb-2 pt-2">
        <Text className="text-3xl font-bold text-slate-900">Matches</Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={() => (
            <View className="mt-24 items-center px-8">
              <Text className="text-5xl">💬</Text>
              <Text className="mt-4 text-center text-base text-slate-600">
                No matches yet.
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-400">
                Swipe right on Discover to build your list.
              </Text>
            </View>
          )}
          renderItem={({ item }) => <MatchRow match={item} />}
          ItemSeparatorComponent={() => <View className="h-px bg-slate-100" />}
        />
      )}
    </SafeAreaView>
  );
}

function MatchRow({ match }: { match: MatchSummary }) {
  const preview = match.last_message
    ? match.last_message
    : 'Say hi to start the conversation.';

  const previewStyle = match.last_message
    ? 'text-sm text-slate-600'
    : 'text-sm italic text-slate-400';

  return (
    <Pressable className="flex-row items-center rounded-xl bg-white p-3 active:bg-slate-50">
      <View className="mr-3 h-14 w-14 overflow-hidden rounded-full bg-slate-100">
        {match.other_photo_url ? (
          <Image
            source={{ uri: match.other_photo_url }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl">⛳</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">
          {match.other_display_name ?? 'Unnamed'}
        </Text>
        <Text className={previewStyle} numberOfLines={1}>
          {preview}
        </Text>
      </View>

      <View className="ml-2 items-end">
        {match.last_message_at ? (
          <Text className="text-[11px] text-slate-400">
            {formatRelative(match.last_message_at)}
          </Text>
        ) : null}
        {match.unread_count > 0 ? (
          <View className="mt-1 min-w-[20px] items-center rounded-full bg-emerald-600 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">
              {match.unread_count}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
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

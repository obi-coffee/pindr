import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCandidates, type Candidate } from '../../../lib/discover/queries';

export default function Discover() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-2">
        <Text className="text-3xl font-bold text-slate-900">Discover</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Candidates within 100 km. Swipe deck comes next.
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={() => (
            <View className="mt-20 items-center px-6">
              <Text className="text-center text-base text-slate-500">
                No one nearby yet.
              </Text>
              <Text className="mt-2 text-center text-sm text-slate-400">
                Create another test account from the sign-in screen to see
                Discover light up.
              </Text>
            </View>
          )}
          renderItem={({ item }) => <CandidateRow candidate={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  const firstPhoto = candidate.photo_urls[0];
  return (
    <View className="mb-3 flex-row items-center rounded-xl border border-slate-200 bg-white p-3">
      <View className="mr-3 h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
        {firstPhoto ? (
          <Image
            source={{ uri: firstPhoto }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl text-slate-300">⛳</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">
          {candidate.display_name ?? 'Unnamed'}
          {candidate.age ? `, ${candidate.age}` : ''}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">
          {[
            candidate.home_city,
            candidate.distance_km !== null
              ? `${candidate.distance_km.toFixed(1)} km`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {candidate.style_default ? (
          <View className="mt-1 self-start rounded-full bg-emerald-50 px-2 py-0.5">
            <Text className="text-[10px] font-medium uppercase text-emerald-700">
              {candidate.style_default}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

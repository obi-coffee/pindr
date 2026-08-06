import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckinCard } from '../../../components/CheckinCard';
import { TodayCard } from '../../../components/TodayCard';
import { SkeletonRoundsList } from '../../../components/lists/SkeletonRoundsList';
import { FadeIn } from '../../../components/motion/FadeIn';
import { usePullRefresh } from '../../../components/motion/PullRefresh';
import { RoundListRow } from '../../../components/RoundListRow';
import {
  RoundsFilterBar,
  presetRange,
  type RoundsFilters,
} from '../../../components/RoundsFilterBar';
import { PindrLogo, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { listPendingCheckinRounds } from '../../../lib/rounds/checkins';
import { listTodayLockedRounds } from '../../../lib/rounds/today';
import {
  listOpenRounds,
  type RoundListItem,
  type RoundWithCourse,
} from '../../../lib/rounds/queries';

const DEFAULT_FILTERS: RoundsFilters = {
  preset: '30d',
  course: null,
};

export default function Rounds() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [filters, setFilters] = useState<RoundsFilters>(DEFAULT_FILTERS);
  const [rounds, setRounds] = useState<RoundListItem[]>([]);
  const [pendingCheckins, setPendingCheckins] = useState<RoundWithCourse[]>([]);
  const [todayRounds, setTodayRounds] = useState<RoundWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (next: RoundsFilters, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const { from, to } = presetRange(next.preset);
        const data = await listOpenRounds({
          courseId: next.course?.id ?? null,
          from,
          to,
        });
        setRounds(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Day-of and check-in cards load independently of the feed — a feed
  // error shouldn't hide them, and vice versa.
  const loadCards = useCallback(async () => {
    if (!user) return;
    try {
      const [pending, today] = await Promise.all([
        listPendingCheckinRounds(user.id),
        listTodayLockedRounds(user.id),
      ]);
      setPendingCheckins(pending);
      setTodayRounds(today);
    } catch {
      setPendingCheckins([]);
      setTodayRounds([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load(filters);
      loadCards();
    }, [load, loadCards, filters]),
  );

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const refreshControl = usePullRefresh({
    refreshing,
    onRefresh: () => {
      load(filters, true);
      loadCards();
    },
  });

  // A round shortly past its tee time can qualify for both cards; the
  // day-of card wins until its window closes.
  const todayIds = new Set(todayRounds.map((r) => r.id));
  const activeCheckin =
    pendingCheckins.filter((r) => !todayIds.has(r.id))[0] ?? null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 10,
        }}
      >
        <PindrLogo height={35} />
        <Typography variant="h1">rounds</Typography>
      </View>

      {user
        ? todayRounds.map((r) => (
            <TodayCard key={r.id} round={r} userId={user.id} />
          ))
        : null}

      {activeCheckin && user ? (
        <CheckinCard
          key={activeCheckin.id}
          round={activeCheckin}
          userId={user.id}
          onDismiss={() => setPendingCheckins((prev) => prev.slice(1))}
        />
      ) : null}

      <RoundsFilterBar value={filters} onChange={setFilters} />

      {loading && !refreshing ? (
        <SkeletonRoundsList />
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
            couldn't load rounds. check your signal and try again?
          </Typography>
        </View>
      ) : (
        <FadeIn style={{ flex: 1 }}>
        <FlatList
          data={rounds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={refreshControl}
          ListHeaderComponent={
            rounds.length > 0 ? (
              <Typography
                variant="caption"
                color="ink-subtle"
                style={{ paddingHorizontal: 20, paddingBottom: 8 }}
              >
                NEAREST FIRST
              </Typography>
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.stroke,
                marginHorizontal: 20,
              }}
            />
          )}
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 80,
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <Typography variant="display-lg" style={{ textAlign: 'center' }}>
                no rounds{'\n'}in range.
              </Typography>
              <View style={{ height: 12 }} />
              <Typography
                variant="body"
                color="ink-soft"
                style={{ textAlign: 'center' }}
              >
                widen the date range, or post one yourself.
              </Typography>
            </View>
          )}
          renderItem={({ item }) => (
            <RoundListRow
              round={item}
              onPress={() => router.push(`/rounds/${item.id}` as never)}
            />
          )}
        />
        </FadeIn>
      )}
    </SafeAreaView>
  );
}

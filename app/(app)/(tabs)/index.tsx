import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { MatchModal } from '../../../components/MatchModal';
import { SwipeCard } from '../../../components/SwipeCard';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  DEFAULT_FILTERS,
  loadFilters,
  type DiscoverFilters,
} from '../../../lib/discover/filters';
import {
  fetchCandidates,
  recordSwipe,
  type Candidate,
  type SwipeDirection,
} from '../../../lib/discover/queries';
import {
  fetchActiveOrUpcomingSession,
  type TravelSession,
} from '../../../lib/travel/queries';

export default function Discover() {
  const { user, profile } = useAuth();
  const { width, height } = useWindowDimensions();
  const swiperRef = useRef<SwiperCardRefType>(null);

  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [travel, setTravel] = useState<TravelSession | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Candidate | null>(null);

  const load = useCallback(async (nextFilters: DiscoverFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates(nextFilters);
      setCandidates(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Re-read filters + travel session every time the screen gains focus
      // so closing either modal triggers a refetch.
      (async () => {
        const [f, t] = await Promise.all([
          loadFilters(),
          user ? fetchActiveOrUpcomingSession(user.id) : Promise.resolve(null),
        ]);
        setFilters(f);
        setTravel(t);
        load(f);
      })();
    }, [load, user]),
  );

  const handleSwipe = useCallback(
    async (cardIndex: number, direction: SwipeDirection) => {
      if (!user) return;
      const candidate = candidates[cardIndex];
      if (!candidate) return;
      try {
        const result = await recordSwipe(user.id, candidate.user_id, direction);
        if (result.matched) setMatch(candidate);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [candidates, user],
  );

  const cardWidth = width - 32;
  const cardHeight = Math.min(height - 260, cardWidth * 1.5);

  const activeFilterCount = countActiveFilters(filters);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
        <Text className="text-3xl font-bold text-slate-900">Discover</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push('/travel')}
            className={`rounded-full border px-3 py-1 active:opacity-70 ${
              travel ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                travel ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {travel ? `✈ ${travel.city}` : 'Travel'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/filters')}
            className="flex-row items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 active:opacity-70"
          >
            <Text className="text-xs font-medium text-slate-600">Filters</Text>
            {activeFilterCount > 0 ? (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                <Text className="text-[10px] font-bold text-white">
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-red-500">{error}</Text>
          <Pressable
            onPress={() => load(filters)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm text-slate-700">Try again</Text>
          </Pressable>
        </View>
      ) : candidates.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl">🏁</Text>
          <Text className="mt-4 text-center text-base text-slate-600">
            No one new matches your filters.
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            Loosen your filters or refresh later.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <Swiper
            ref={swiperRef}
            data={candidates}
            cardStyle={{ width: cardWidth, height: cardHeight }}
            renderCard={(item) => <SwipeCard candidate={item} />}
            onSwipeRight={(i) => handleSwipe(i, 'right')}
            onSwipeLeft={(i) => handleSwipe(i, 'left')}
            onSwipeTop={(i) => handleSwipe(i, 'super')}
            onSwipedAll={() => setCandidates([])}
            disableBottomSwipe
          />

          <View className="flex-row items-center justify-center gap-6 pb-6 pt-4">
            <ActionButton
              label="✕"
              onPress={() => swiperRef.current?.swipeLeft()}
              variant="left"
            />
            <ActionButton
              label="★"
              onPress={() => swiperRef.current?.swipeTop()}
              variant="super"
            />
            <ActionButton
              label="♥"
              onPress={() => swiperRef.current?.swipeRight()}
              variant="right"
            />
          </View>
        </View>
      )}

      <MatchModal
        match={match}
        myPhotoUrl={profile?.photo_urls?.[0] ?? null}
        onKeepSwiping={() => setMatch(null)}
      />
    </SafeAreaView>
  );
}

function countActiveFilters(f: DiscoverFilters): number {
  let n = 0;
  if (f.maxDistanceKm !== DEFAULT_FILTERS.maxDistanceKm) n++;
  if (f.minAge !== null || f.maxAge !== null) n++;
  if (f.minHandicap !== null || f.maxHandicap !== null) n++;
  if (f.genders && f.genders.length > 0) n++;
  if (f.playStyles && f.playStyles.length > 0) n++;
  if (f.womenOnly) n++;
  return n;
}

function ActionButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: 'left' | 'super' | 'right';
}) {
  const colors = {
    left: 'bg-white border-red-200 text-red-500',
    super: 'bg-white border-sky-200 text-sky-500',
    right: 'bg-white border-emerald-300 text-emerald-600',
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      className={`h-14 w-14 items-center justify-center rounded-full border-2 shadow-sm active:opacity-70 ${colors}`}
    >
      <Text className={`text-2xl ${colors}`}>{label}</Text>
    </Pressable>
  );
}

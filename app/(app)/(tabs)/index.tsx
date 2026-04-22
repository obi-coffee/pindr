import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { MatchModal } from '../../../components/MatchModal';
import { SwipeCard } from '../../../components/SwipeCard';
import { PindrLogo, Typography, useTheme } from '../../../components/ui';
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
import { maybePromptForPush } from '../../../lib/push/maybePrompt';
import { openUserMenu } from '../../../lib/safety/menu';
import {
  fetchActiveOrUpcomingSession,
  type TravelSession,
} from '../../../lib/travel/queries';

export default function Discover() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
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
        if (result.matched) {
          setMatch(candidate);
          void maybePromptForPush(user.id, 'first_match');
        }
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [candidates, user],
  );

  const cardWidth = width - 32;
  // Header (~60) + nav pill footprint (~78) + safe insets + breathing room.
  const cardHeight = height - 220;

  const activeFilterCount = countActiveFilters(filters);

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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <HeaderPill
            label={travel ? `✈ ${travel.city}` : 'Travel'}
            highlighted={Boolean(travel)}
            onPress={() => router.push('/travel')}
          />
          <HeaderPill
            label="Filters"
            badgeCount={activeFilterCount}
            onPress={() => router.push('/filters')}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
          <Typography variant="body" color="burgundy" style={{ textAlign: 'center' }}>
            couldn't load this. check your signal and try again?
          </Typography>
          <Pressable
            onPress={() => load(filters)}
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors['stroke-strong'],
            }}
          >
            <Typography variant="caption">try again</Typography>
          </Pressable>
        </View>
      ) : candidates.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Typography variant="display-lg" style={{ textAlign: 'center' }}>
            nobody{'\n'}nearby yet.
          </Typography>
          <View style={{ height: 12 }} />
          <Typography
            variant="body"
            color="ink-soft"
            style={{ textAlign: 'center' }}
          >
            widen your distance, or flip on travel mode if you're away from home.
          </Typography>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 78,
          }}
        >
          <View style={{ width: cardWidth, height: cardHeight }}>
            <Swiper
              ref={swiperRef}
              data={candidates}
              cardStyle={{ width: cardWidth, height: cardHeight }}
              renderCard={(item) => (
                <SwipeCard
                  candidate={item}
                  onMenu={() => {
                    if (!user) return;
                    openUserMenu({
                      currentUserId: user.id,
                      targetUserId: item.user_id,
                      targetName: item.display_name,
                      onBlocked: () => {
                        setCandidates((prev) =>
                          prev.filter((c) => c.user_id !== item.user_id),
                        );
                      },
                    });
                  }}
                  onPass={() => swiperRef.current?.swipeLeft()}
                  onLockIn={() => swiperRef.current?.swipeRight()}
                />
              )}
              onSwipeRight={(i) => handleSwipe(i, 'right')}
              onSwipeLeft={(i) => handleSwipe(i, 'left')}
              onSwipeTop={(i) => handleSwipe(i, 'super')}
              onSwipedAll={() => setCandidates([])}
              disableBottomSwipe
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

function HeaderPill({
  label,
  onPress,
  highlighted,
  badgeCount,
}: {
  label: string;
  onPress: () => void;
  highlighted?: boolean;
  badgeCount?: number;
}) {
  const { colors } = useTheme();
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: highlighted ? colors.ink : colors['stroke-strong'],
        backgroundColor: highlighted ? colors.ink : 'transparent',
      }}
    >
      <Typography
        variant="caption"
        color={highlighted ? 'paper-high' : 'ink'}
      >
        {label}
      </Typography>
      {showBadge ? (
        <View
          style={{
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 999,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" color="paper-high">
            {String(badgeCount)}
          </Typography>
        </View>
      ) : null}
    </Pressable>
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

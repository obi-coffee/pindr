import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { SkeletonDeck } from '../../../components/lists/SkeletonDeck';
import { MatchModal } from '../../../components/MatchModal';
import { FadeIn } from '../../../components/motion/FadeIn';
import { SwipeCard } from '../../../components/SwipeCard';
import { LockedInStamp, MaybeLaterStamp } from '../../../components/swipe/SwipeStamp';
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
import { useHaptics } from '../../../lib/haptics';
import { useToast } from '../../../components/motion/Toast';
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
  const haptics = useHaptics();
  const { show: showToast } = useToast();

  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [travel, setTravel] = useState<TravelSession | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<{
    candidate: Candidate;
    matchId: string;
  } | null>(null);

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
      haptics.swipeRelease();
      try {
        const result = await recordSwipe(user.id, candidate.user_id, direction);
        if (result.matched) {
          setMatch({ candidate, matchId: result.matchId });
          void maybePromptForPush(user.id, 'first_match');
        }
      } catch {
        // Swipe is already optimistic (card is off-screen). No rollback,
        // just surface the failure. The missing swipes row will be retried
        // if the user encounters the same candidate in a later session.
        showToast("couldn't save that — mind trying again?", {
          variant: 'error',
        });
      }
    },
    [candidates, user, haptics, showToast],
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
          <SkeletonDeck width={cardWidth} height={cardHeight} />
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
        <FadeIn
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
                      toast: showToast,
                      onBlocked: () => {
                        setCandidates((prev) =>
                          prev.filter((c) => c.user_id !== item.user_id),
                        );
                      },
                      onBlockFailed: () => {
                        // Restore the card to the deck if the server
                        // rejects the block.
                        setCandidates((prev) => {
                          if (prev.some((c) => c.user_id === item.user_id)) {
                            return prev;
                          }
                          return [item, ...prev];
                        });
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
              OverlayLabelRight={LockedInStamp}
              OverlayLabelLeft={MaybeLaterStamp}
              // Stamp fully opaque once drag reaches 40% of card-width
              // (plan §4.1 spec is 30-100%; two-point range matches the
              // library's default shape which 3 points sometimes broke).
              inputOverlayLabelRightOpacityRange={[0, cardWidth * 0.4]}
              outputOverlayLabelRightOpacityRange={[0, 1]}
              inputOverlayLabelLeftOpacityRange={[0, -cardWidth * 0.4]}
              outputOverlayLabelLeftOpacityRange={[0, 1]}
              // Library applies rotate in RADIANS, not degrees. Cap at ±8°
              // at screen edges per plan §4.1. 8° ≈ Math.PI / 22.5.
              rotateInputRange={[-width, 0, width]}
              rotateOutputRange={[-Math.PI / 22.5, 0, Math.PI / 22.5]}
            />
          </View>
        </FadeIn>
      )}

      <MatchModal
        match={match?.candidate ?? null}
        myPhotoUrl={profile?.photo_urls?.[0] ?? null}
        onKeepSwiping={() => setMatch(null)}
        onSayHi={() => {
          if (!match) return;
          const { matchId } = match;
          setMatch(null);
          router.push(`/chat/${matchId}` as never);
        }}
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

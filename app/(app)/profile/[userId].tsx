import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../../components/motion/Toast';
import { Button, Tag, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchProfileById,
  recordSwipe,
  type Candidate,
} from '../../../lib/discover/queries';
import { useMatch } from '../../../lib/match/MatchProvider';
import { PROFILE_QUESTIONS } from '../../../lib/profile/questions';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const { showMatch } = useMatch();
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProfileById(userId);
      setProfile(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSwipe = async (direction: 'right' | 'left') => {
    if (!user || !profile || acting) return;
    setActing(true);
    try {
      const result = await recordSwipe(user.id, profile.user_id, direction);
      // The MatchModal is rendered by MatchProvider at the root, so
      // it stays mounted as we pop back to the deck. Showing it before
      // the back-navigation means the user sees the moment land
      // immediately and the deck slides in beneath it.
      if (result.matched) showMatch(profile, result.matchId);
      router.back();
    } catch {
      setActing(false);
      showToast("couldn't save that — mind trying again?", {
        variant: 'error',
      });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
    >
      <Header />

      {loading ? (
        <CenteredLoader />
      ) : error ? (
        <CenteredError message="couldn't load this profile" onRetry={load} />
      ) : !profile ? (
        <CenteredMessage message="this profile is no longer available." />
      ) : (
        <ProfileBody
          profile={profile}
          width={width}
          onPass={() => onSwipe('left')}
          onLike={() => onSwipe('right')}
          acting={acting}
        />
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
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
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Typography variant="caption" color="ink-soft">
          back
        </Typography>
      </Pressable>
      <Typography variant="caption" color="ink">
        profile
      </Typography>
      <View style={{ minWidth: 48 }} />
    </View>
  );
}

function CenteredLoader() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

function CenteredError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <Typography
        variant="body"
        color="burgundy"
        style={{ textAlign: 'center' }}
      >
        {message}
      </Typography>
      <Button variant="ghost" size="md" onPress={onRetry}>
        try again
      </Button>
    </View>
  );
}

function CenteredMessage({ message }: { message: string }) {
  return (
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
        color="ink-soft"
        style={{ textAlign: 'center' }}
      >
        {message}
      </Typography>
    </View>
  );
}

type ProfileBodyProps = {
  profile: Candidate;
  width: number;
  onPass: () => void;
  onLike: () => void;
  acting: boolean;
};

function ProfileBody({
  profile,
  width,
  onPass,
  onLike,
  acting,
}: ProfileBodyProps) {
  const { colors } = useTheme();
  const photos = profile.photo_urls.filter(Boolean);
  const distance =
    profile.distance_km !== null
      ? `${Math.max(1, Math.round(profile.distance_km * 0.621))} mi away`
      : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Photo carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width }}
        >
          {photos.length > 0 ? (
            photos.map((url, i) => (
              <Image
                key={`${url}-${i}`}
                source={{ uri: url }}
                style={{ width, height: width, backgroundColor: colors.stone }}
                resizeMode="cover"
              />
            ))
          ) : (
            <View
              style={{
                width,
                height: width,
                backgroundColor: colors.stone,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body" color="ink-subtle">
                no photo
              </Typography>
            </View>
          )}
        </ScrollView>

        {/* Header block */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 4 }}>
          <Typography variant="display-lg">
            {profile.display_name ?? 'Unnamed'}
            {profile.age ? `, ${profile.age}` : ''}
          </Typography>
          {profile.pronouns ? (
            <Typography variant="body" color="ink-soft">
              {profile.pronouns}
            </Typography>
          ) : null}
          {distance ? (
            <Typography variant="body" color="ink-soft">
              {distance}
            </Typography>
          ) : null}
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: 'row',
            gap: 24,
            paddingHorizontal: 20,
            paddingVertical: 16,
            marginTop: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.stroke,
          }}
        >
          <Stat
            label="HANDICAP"
            value={
              profile.has_handicap && profile.handicap !== null
                ? profile.handicap.toFixed(1)
                : 'None'
            }
          />
          <Stat
            label="PLAYING"
            value={
              profile.years_playing === null
                ? '—'
                : profile.years_playing >= 10
                  ? '10+ yrs'
                  : `${profile.years_playing} yrs`
            }
          />
          <Stat label="STYLE" value={titleCase(profile.style_default) ?? '—'} />
        </View>

        {/* Bio */}
        {profile.bio && profile.bio.trim() ? (
          <Section label="IN THEIR WORDS">
            <Typography variant="body-lg">{profile.bio.trim()}</Typography>
          </Section>
        ) : null}

        {/* Home */}
        {(profile.home_course_name || profile.home_city) ? (
          <Section label="HOME">
            <Typography variant="body-lg">
              {[profile.home_course_name, profile.home_city]
                .filter(Boolean)
                .join(', ')}
            </Typography>
          </Section>
        ) : null}

        {/* Play-style fields */}
        <Section label="THE GAME">
          <Field label="Walking" value={titleCase(walkingLabel(profile.walking_preference))} />
          <Field label="Holes" value={titleCase(holesLabel(profile.holes_preference))} />
          <Field label="Pace" value={titleCase(profile.pace)} />
          <Field label="Betting" value={titleCase(profile.betting)} />
          <Field label="Drinks" value={titleCase(profile.drinks)} />
          <Field
            label="Post-round"
            value={titleCase(postRoundLabel(profile.post_round))}
          />
          <Field
            label="Teaching"
            value={titleCase(teachingLabel(profile.teaching_mindset))}
          />
        </Section>

        {/* Optional culture-fit answers (Phase 2). Skip questions
            with no answer so empty rows don't render. */}
        {profile.profile_answers &&
        Object.values(profile.profile_answers).some(
          (v) => v && v.trim().length > 0,
        ) ? (
          <Section label="QUESTIONS">
            <View style={{ gap: 14 }}>
              {PROFILE_QUESTIONS.map((q) => {
                const answer = profile.profile_answers?.[q.id];
                if (!answer || !answer.trim()) return null;
                return (
                  <View key={q.id} style={{ gap: 4 }}>
                    <Typography variant="caption" color="ink-subtle">
                      {q.prompt}
                    </Typography>
                    <Typography variant="body">{answer}</Typography>
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        {profile.upcoming_round_id &&
        profile.upcoming_round_tee_time &&
        profile.upcoming_round_course_name ? (
          <Section label="UPCOMING ROUND">
            <Pressable
              onPress={() =>
                router.push(`/rounds/${profile.upcoming_round_id}` as never)
              }
            >
              <Tag size="md" variant="solid">
                {formatRoundLabel(
                  profile.upcoming_round_tee_time,
                  profile.upcoming_round_course_name,
                )}
              </Tag>
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>

      {/* Sticky action bar */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderColor: colors.stroke,
          backgroundColor: colors.paper,
        }}
      >
        <Button
          variant="destructive"
          size="lg"
          style={{ flex: 1 }}
          disabled={acting}
          onPress={onPass}
        >
          Pass
        </Button>
        <Button
          variant="primary"
          size="lg"
          style={{ flex: 1 }}
          disabled={acting}
          onPress={onLike}
        >
          Lock in
        </Button>
      </View>
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 8 }}>
      <Typography variant="caption" color="ink-subtle">
        {label}
      </Typography>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Typography variant="caption" color="ink-subtle">
        {label}
      </Typography>
      <Typography variant="body-lg">{value}</Typography>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
      }}
    >
      <Typography variant="body" color="ink-soft">
        {label}
      </Typography>
      <Typography variant="body">{value}</Typography>
    </View>
  );
}

function titleCase(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function walkingLabel(v: string | null): string | null {
  if (v === 'walk') return 'Always walks';
  if (v === 'ride') return 'Always rides';
  if (v === 'either') return 'Walks or rides';
  return null;
}

function holesLabel(v: string | null): string | null {
  if (v === '9') return '9 only';
  if (v === '18') return '18 only';
  if (v === 'either') return '9 or 18';
  return null;
}

function postRoundLabel(v: string | null): string | null {
  if (v === 'hangout') return 'Down to hang';
  if (v === 'just_round') return 'Just the round';
  return null;
}

function teachingLabel(v: string | null): string | null {
  if (v === 'open_to_tips') return 'Open to tips';
  if (v === 'just_play') return 'Just play';
  return null;
}

function formatRoundLabel(teeIso: string, course: string): string {
  const tee = new Date(teeIso);
  const day = tee
    .toLocaleDateString(undefined, { weekday: 'short' })
    .toUpperCase();
  const time = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} ${time} · ${course}`;
}

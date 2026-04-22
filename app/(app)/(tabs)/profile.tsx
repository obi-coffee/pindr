import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  GearIcon,
  PindrLogo,
  PlusIcon,
  Tag,
  Typography,
  radii,
  useTheme,
} from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchAllInterests,
  fetchUserInterestIds,
  type Interest,
} from '../../../lib/profile/interests';

const GENDER_LABEL: Record<string, string> = {
  woman: 'Woman',
  man: 'Man',
  nonbinary: 'Non-binary/non-conforming',
  another: 'Another identity',
  prefer_not_to_say: 'Prefer not to say',
};
const STYLE_LABEL: Record<string, string> = {
  relaxed: 'Relaxed',
  improvement: 'Improvement',
  competitive: 'Competitive',
};
const PACE_LABEL: Record<string, string> = {
  chill: 'Chill',
  moderate: 'Moderate',
  ready: 'Ready golf',
};
const WALKING_LABEL: Record<string, string> = {
  walk: 'Walks',
  ride: 'Rides',
  either: 'Walk or ride',
};
const HOLES_LABEL: Record<string, string> = {
  '9': '9 only',
  '18': '18 only',
  either: '9 or 18',
};
const BETTING_LABEL: Record<string, string> = {
  yes: 'Bets',
  small: 'Small bets',
  no: 'No bets',
};
const DRINKS_LABEL: Record<string, string> = {
  yes: 'Drinks on course',
  sometimes: 'Sometimes',
  no: 'No drinks',
};
const POST_ROUND_LABEL: Record<string, string> = {
  hangout: 'Post-round hang',
  just_round: 'Just the round',
};
const TEACHING_LABEL: Record<string, string> = {
  open_to_tips: 'Open to tips',
  just_play: 'Just play',
};

export default function Profile() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [myInterestIds, setMyInterestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [all, mine] = await Promise.all([
          fetchAllInterests(),
          fetchUserInterestIds(user.id),
        ]);
        setInterests(all);
        setMyInterestIds(new Set(mine));
      } catch {
        // Non-fatal — the interests section just stays empty.
      }
    })();
  }, [user, profile?.updated_at]);

  const photos = profile?.photo_urls ?? [];
  const photoSize = width - 40;
  const photoHeight = photoSize * 1.25;

  const styleTags: string[] = [];
  if (profile?.style_default) styleTags.push(STYLE_LABEL[profile.style_default] ?? profile.style_default);
  if (profile?.pace) styleTags.push(PACE_LABEL[profile.pace] ?? profile.pace);
  if (profile?.walking_preference) styleTags.push(WALKING_LABEL[profile.walking_preference] ?? profile.walking_preference);
  if (profile?.holes_preference) styleTags.push(HOLES_LABEL[profile.holes_preference] ?? profile.holes_preference);
  if (profile?.teaching_mindset) styleTags.push(TEACHING_LABEL[profile.teaching_mindset] ?? profile.teaching_mindset);
  if (profile?.betting) styleTags.push(BETTING_LABEL[profile.betting] ?? profile.betting);
  if (profile?.drinks) styleTags.push(DRINKS_LABEL[profile.drinks] ?? profile.drinks);
  if (profile?.post_round) styleTags.push(POST_ROUND_LABEL[profile.post_round] ?? profile.post_round);

  const myInterests = interests.filter((i) => myInterestIds.has(i.id));

  const subtitleParts = [profile?.pronouns, profile?.home_city].filter(
    (p): p is string => Boolean(p && p.trim()),
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }}>
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
          <Typography variant="h1">profile</Typography>
        </View>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <Typography variant="caption" color="ink-soft">
            photos
          </Typography>
          <Link href="/edit/photos" asChild>
            <Pressable hitSlop={8}>
              <Typography variant="caption" color="ink">
                edit
              </Typography>
            </Pressable>
          </Link>
        </View>

        {photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {photos.map((url, i) => (
              <Image
                key={`${url}-${i}`}
                source={{ uri: url }}
                style={{
                  width: photoSize,
                  height: photoHeight,
                  borderRadius: radii.lg,
                  marginRight: i === photos.length - 1 ? 0 : 12,
                  backgroundColor: colors['paper-raised'],
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <Link href="/edit/photos" asChild>
            <Pressable
              style={{
                marginHorizontal: 20,
                aspectRatio: 4 / 5,
                backgroundColor: colors['paper-raised'],
                borderRadius: radii.lg,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors['stroke-strong'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlusIcon size={32} />
              <Typography
                variant="body-sm"
                color="ink-subtle"
                style={{ marginTop: 12 }}
              >
                add your first photo
              </Typography>
            </Pressable>
          </Link>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Typography variant="h1" style={{ flex: 1 }}>
              {profile?.display_name ?? 'your profile'}
              {profile?.age ? `, ${profile.age}` : ''}
            </Typography>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityLabel="settings"
            >
              <GearIcon size={24} color="ink-soft" />
            </Pressable>
          </View>
          {subtitleParts.length > 0 ? (
            <Typography
              variant="body-sm"
              color="ink-soft"
              style={{ marginTop: 4 }}
            >
              {subtitleParts.join(' · ')}
            </Typography>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Button
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              onPress={() => router.push('/rounds/new')}
            >
              post a round
            </Button>
            <Button
              variant="mustard"
              size="md"
              style={{ flex: 1 }}
              onPress={() => router.push('/rounds/mine')}
            >
              your rounds
            </Button>
          </View>
        </View>

        <Section title="basics" editHref="/edit/basics">
          {profile?.bio && profile.bio.trim() ? (
            <Typography variant="body-lg">{profile.bio.trim()}</Typography>
          ) : (
            <Typography variant="body-sm" color="ink-subtle">
              no bio yet.
            </Typography>
          )}
          {profile?.gender ? (
            <Typography
              variant="body-sm"
              color="ink-soft"
              style={{ marginTop: 8 }}
            >
              {GENDER_LABEL[profile.gender] ?? profile.gender}
            </Typography>
          ) : null}
        </Section>

        <Section title="golf" editHref="/edit/golf">
          {profile?.home_course_name ? (
            <Typography
              variant="card-meta"
              color="ink-soft"
              style={{ marginBottom: 12 }}
            >
              Home · {profile.home_course_name}
            </Typography>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              gap: 24,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.stroke,
            }}
          >
            <Stat
              label="Handicap"
              value={
                profile?.has_handicap && profile?.handicap !== null
                  ? profile.handicap.toFixed(1)
                  : 'None'
              }
            />
            <Stat
              label="Playing"
              value={
                profile?.years_playing === null ||
                profile?.years_playing === undefined
                  ? '—'
                  : profile.years_playing >= 10
                    ? '10+ yrs'
                    : `${profile.years_playing} yrs`
              }
            />
            <Stat
              label="Style"
              value={
                profile?.style_default
                  ? (STYLE_LABEL[profile.style_default] ?? '—')
                  : '—'
              }
            />
          </View>
        </Section>

        <Section title="how you play" editHref="/edit/style">
          {styleTags.length === 0 ? (
            <Typography variant="body-sm" color="ink-subtle">
              not set yet.
            </Typography>
          ) : (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
            >
              {styleTags.map((label) => (
                <Tag key={label} size="sm">
                  {label}
                </Tag>
              ))}
            </View>
          )}
        </Section>

        <Section title="interests" editHref="/edit/interests">
          {myInterests.length === 0 ? (
            <Typography variant="body-sm" color="ink-subtle">
              none picked yet.
            </Typography>
          ) : (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
            >
              {myInterests.map((i) => (
                <Tag key={i.id} size="sm">
                  {i.name}
                </Tag>
              ))}
            </View>
          )}
        </Section>

        <Section title="location" editHref="/edit/location">
          {profile?.home_city ? (
            <Typography variant="body">{profile.home_city}</Typography>
          ) : (
            <Typography variant="body-sm" color="ink-subtle">
              no location set.
            </Typography>
          )}
        </Section>

        {__DEV__ ? (
          <View style={{ marginTop: 40 }}>
            <Row label="UI kit (dev)" href="/dev/ui-kit" />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}
      >
        <Typography variant="caption" color="ink-soft">
          {title}
        </Typography>
        {editHref ? (
          <Link href={editHref as never} asChild>
            <Pressable hitSlop={8}>
              <Typography variant="caption" color="ink">
                edit
              </Typography>
            </Pressable>
          </Link>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Typography variant="card-stat-label" color="ink-subtle">
        {label}
      </Typography>
      <Typography variant="card-stat-value">{value}</Typography>
    </View>
  );
}

function Row({
  label,
  href,
  onPress,
}: {
  label: string;
  href?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <Typography variant="body">{label}</Typography>
      <Typography variant="body" color="ink-subtle">
        ›
      </Typography>
    </View>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable>{content}</Pressable>
      </Link>
    );
  }
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

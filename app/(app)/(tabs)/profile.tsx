import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchAllInterests,
  fetchUserInterestIds,
  type Interest,
} from '../../../lib/profile/interests';

const STYLE_LABELS: Record<string, string> = {
  relaxed: 'Relaxed',
  improvement: 'Improvement',
  competitive: 'Competitive',
  chill: 'Chill',
  moderate: 'Moderate',
  ready: 'Ready golf',
  walk: 'Walk',
  ride: 'Ride',
  either: 'Either',
  '9': '9 holes',
  '18': '18 holes',
  open_to_tips: 'Open to tips',
  just_play: 'Just play',
  yes: 'Yes',
  small: 'Small stakes',
  no: 'No',
  sometimes: 'Sometimes',
  hangout: 'Food & drinks after',
  just_round: 'Just the round',
};

const label = (value: string | null | undefined): string =>
  value ? (STYLE_LABELS[value] ?? value) : '—';

export default function Home() {
  const { user, profile, signOut } = useAuth();
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
        // Non-fatal: we just won't show the chips.
      }
    })();
  }, [user, profile?.updated_at]);

  const photos = profile?.photo_urls ?? [];
  const photoSize = width - 48; // 24px horizontal padding on each side

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-2">
          <Text className="text-3xl font-bold text-slate-900">
            {profile?.display_name ?? 'Your profile'}
            {profile?.age ? `, ${profile.age}` : ''}
          </Text>
          {profile?.pronouns ? (
            <Text className="mt-1 text-sm text-slate-500">
              {profile.pronouns}
            </Text>
          ) : null}
          {profile?.home_city ? (
            <Text className="mt-1 text-sm text-slate-500">
              📍 {profile.home_city}
            </Text>
          ) : null}
        </View>

        {photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
            className="mt-2"
          >
            {photos.map((url, i) => (
              <Image
                key={`${url}-${i}`}
                source={{ uri: url }}
                style={{
                  width: photoSize,
                  height: photoSize * 1.25,
                  borderRadius: 16,
                  marginRight: i === photos.length - 1 ? 0 : 12,
                  backgroundColor: '#f1f5f9',
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View className="mx-6 mt-4 items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12">
            <Text className="text-sm text-slate-400">No photos yet</Text>
          </View>
        )}

        <Section
          title="Basics"
          editHref="/edit/basics"
        >
          <Row label="Bio" value={profile?.bio} multi />
          <Row label="Gender" value={profile?.gender} />
        </Section>

        <Section title="Golf" editHref="/edit/golf">
          <Row
            label="Handicap"
            value={
              profile?.has_handicap
                ? profile.handicap?.toString() ?? '—'
                : 'No handicap yet'
            }
          />
          <Row
            label="Years playing"
            value={profile?.years_playing?.toString()}
          />
          <Row label="Home course" value={profile?.home_course_name} />
        </Section>

        <Section title="How I play" editHref="/edit/style">
          <Row label="Style" value={label(profile?.style_default)} />
          <Row label="Pace" value={label(profile?.pace)} />
          <Row label="Walk / ride" value={label(profile?.walking_preference)} />
          <Row label="9 / 18" value={label(profile?.holes_preference)} />
          <Row label="Mindset" value={label(profile?.teaching_mindset)} />
          <Row label="Betting" value={label(profile?.betting)} />
          <Row label="Drinks" value={label(profile?.drinks)} />
          <Row label="After round" value={label(profile?.post_round)} />
        </Section>

        <Section title="Interests" editHref="/edit/interests">
          {myInterestIds.size === 0 ? (
            <Text className="text-sm text-slate-400">None picked</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {interests
                .filter((i) => myInterestIds.has(i.id))
                .map((i) => (
                  <View
                    key={i.id}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1"
                  >
                    <Text className="text-xs font-medium text-emerald-700">
                      {i.name}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </Section>

        <Section title="Location" editHref="/edit/location">
          <Row label="City" value={profile?.home_city} />
        </Section>

        <View className="gap-3 px-6 pt-6">
          <Link href="/blocks" asChild>
            <Pressable className="items-center rounded-lg border border-slate-300 py-3 active:opacity-70">
              <Text className="text-base font-medium text-slate-700">
                Blocked users
              </Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={signOut}
            className="items-center rounded-lg border border-slate-300 py-3 active:opacity-70"
          >
            <Text className="text-base font-medium text-slate-700">
              Sign out
            </Text>
          </Pressable>
        </View>
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
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-8 px-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-900">{title}</Text>
        <Link
          href={editHref as never}
          className="text-sm font-semibold text-emerald-600"
        >
          Edit
        </Link>
      </View>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  multi,
}: {
  label: string;
  value: string | null | undefined;
  multi?: boolean;
}) {
  if (!value) return null;
  return (
    <View className={`mb-2 ${multi ? '' : 'flex-row'}`}>
      <Text className={`text-xs text-slate-500 ${multi ? 'mb-1' : 'w-28'}`}>
        {label}
      </Text>
      <Text className="flex-1 text-sm text-slate-800">{value}</Text>
    </View>
  );
}

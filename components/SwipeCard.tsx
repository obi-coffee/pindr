import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { Candidate } from '../lib/discover/queries';
import {
  Button,
  Card,
  Tag,
  Typography,
  lightColors,
  radii,
  useTheme,
} from './ui';

export type SwipeCardProps = {
  candidate: Candidate;
  onMenu?: () => void;
  onPass?: () => void;
  onLockIn?: () => void;
};

type TagSpec = { label: string; variant: 'outline' | 'solid' };

export function SwipeCard({
  candidate,
  onMenu,
  onPass,
  onLockIn,
}: SwipeCardProps) {
  const { colors } = useTheme();
  const photoUrl = candidate.photo_urls[0];

  const distanceLabel =
    candidate.distance_km !== null
      ? `${Math.max(1, Math.round(candidate.distance_km * 0.621))} mi`
      : null;

  const metaParts = [candidate.home_course_name, candidate.home_city].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  const metaLine = metaParts.length > 0 ? `Home · ${metaParts.join(', ')}` : null;

  const stats = [
    {
      label: 'Handicap',
      value:
        candidate.has_handicap && candidate.handicap !== null
          ? candidate.handicap.toFixed(1)
          : 'None',
    },
    {
      label: 'Playing',
      value:
        candidate.years_playing === null
          ? '—'
          : candidate.years_playing >= 10
            ? '10+ yrs'
            : `${candidate.years_playing} yrs`,
    },
    {
      label: 'Style',
      value: titleCase(candidate.style_default) ?? '—',
    },
  ];

  const tags = buildTags(candidate);

  const badge = candidate.home_city ? (
    <Tag
      size="sm"
      style={{
        backgroundColor: colors['paper-high'],
        borderColor: colors['paper-high'],
      }}
    >
      {candidate.home_city}
    </Tag>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
      <Card
        photo={photoUrl ? { uri: photoUrl } : undefined}
        stateBadge={badge}
        aspectRatio={1}
        overlapRatio={0.25}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 4,
          }}
        >
          <Typography variant="card-name">
            {candidate.display_name ?? 'Unnamed'}
            {candidate.age ? `, ${candidate.age}` : ''}
          </Typography>
          {distanceLabel ? (
            <Typography variant="card-distance" color="ink-soft">
              {distanceLabel}
            </Typography>
          ) : null}
        </View>

        {metaLine ? (
          <Typography
            variant="card-meta"
            color="ink-soft"
            style={{ marginBottom: 12 }}
          >
            {metaLine}
          </Typography>
        ) : (
          <View style={{ height: 12 }} />
        )}

        <View
          style={{
            flexDirection: 'row',
            gap: 20,
            paddingVertical: 10,
            marginBottom: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.stroke,
          }}
        >
          {stats.map((stat) => (
            <View key={stat.label} style={{ gap: 2 }}>
              <Typography variant="card-stat-label" color="ink-subtle">
                {stat.label}
              </Typography>
              <Typography variant="card-stat-value">{stat.value}</Typography>
            </View>
          ))}
        </View>

        {tags.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 12,
            }}
          >
            {tags.map((tag) => (
              <Tag key={tag.label} variant={tag.variant} size="sm">
                {tag.label}
              </Tag>
            ))}
          </View>
        ) : null}

        {candidate.upcoming_round_id &&
        candidate.upcoming_round_tee_time &&
        candidate.upcoming_round_course_name ? (
          <OpenRoundBadge
            roundId={candidate.upcoming_round_id}
            teeTime={candidate.upcoming_round_tee_time}
            courseName={candidate.upcoming_round_course_name}
          />
        ) : null}

        {candidate.bio && candidate.bio.trim() ? (
          <View style={{ marginBottom: 14 }}>
            <Typography
              variant="card-prompt-label"
              color="ink-subtle"
              style={{ marginBottom: 4 }}
            >
              In their words
            </Typography>
            <Typography variant="card-prompt-body" numberOfLines={2}>
              {candidate.bio.trim()}
            </Typography>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
          <Button
            variant="destructive"
            size="lg"
            style={{ flex: 1 }}
            onPress={onPass}
          >
            Pass
          </Button>
          <Button
            variant="primary"
            size="lg"
            style={{ flex: 1, backgroundColor: colors.moss }}
            onPress={onLockIn}
          >
            Lock in
          </Button>
        </View>
      </Card>

      {onMenu ? (
        <Pressable
          onPress={onMenu}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            backgroundColor: colors['paper-high'],
            borderRadius: 999,
            paddingHorizontal: 11,
            paddingVertical: 7,
            zIndex: 3,
          }}
        >
          <Typography variant="caption" color="ink">
            ⋯
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

function titleCase(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function OpenRoundBadge({
  roundId,
  teeTime,
  courseName,
}: {
  roundId: string;
  teeTime: string;
  courseName: string;
}) {
  const { colors } = useTheme();
  const tee = new Date(teeTime);
  const day = tee
    .toLocaleDateString(undefined, { weekday: 'short' })
    .toUpperCase();
  const time = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const courseUpper = courseName.toUpperCase();

  return (
    <Pressable
      onPress={() => router.push(`/rounds/${roundId}` as never)}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: colors.mustard,
        marginBottom: 14,
        gap: 6,
      }}
    >
      <Typography
        variant="card-stat-label"
        numberOfLines={1}
        style={{ color: lightColors.ink }}
      >
        OPEN ROUND · {day} {time} · {courseUpper}
      </Typography>
      <Typography variant="card-stat-label" style={{ color: lightColors.ink }}>
        ›
      </Typography>
    </Pressable>
  );
}

function buildTags(c: Candidate): TagSpec[] {
  const tags: TagSpec[] = [];

  switch (c.walking_preference) {
    case 'walk':
      tags.push({ label: 'Walks', variant: 'outline' });
      break;
    case 'ride':
      tags.push({ label: 'Rides', variant: 'outline' });
      break;
    case 'either':
      tags.push({ label: 'Walk or ride', variant: 'outline' });
      break;
  }

  switch (c.holes_preference) {
    case '9':
      tags.push({ label: '9 only', variant: 'outline' });
      break;
    case '18':
      tags.push({ label: '18 only', variant: 'outline' });
      break;
    case 'either':
      tags.push({ label: '9 or 18', variant: 'outline' });
      break;
  }

  if (c.post_round === 'hangout') {
    tags.push({ label: 'Post-round hang', variant: 'outline' });
  }

  if (c.teaching_mindset === 'open_to_tips') {
    tags.push({ label: 'Open to tips', variant: 'solid' });
  } else if (c.teaching_mindset === 'just_play') {
    tags.push({ label: 'Just play', variant: 'solid' });
  }

  return tags;
}

import { Image, Pressable, View } from 'react-native';
import { Tag, Typography, useTheme } from './ui';
import type { RoundListItem } from '../lib/rounds/queries';

const WALKING_LABEL: Record<string, string> = {
  walk: 'Walking',
  ride: 'Riding',
  either: 'Walk or ride',
};
const MATCH_LABEL: Record<string, string> = {
  casual: 'Casual',
  competitive: 'Competitive',
  either: 'Either',
};

export type RoundListRowProps = {
  round: RoundListItem;
  onPress: () => void;
};

export function RoundListRow({ round, onPress }: RoundListRowProps) {
  const { colors } = useTheme();
  const tee = new Date(round.tee_time);
  const dateLabel = tee
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
  const timeLabel = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handicapLine =
    round.host_has_handicap && round.host_handicap !== null
      ? `${round.host_handicap.toFixed(1)} handicap`
      : 'no handicap set';

  const hostLine =
    [
      round.host_display_name ?? 'Unnamed',
      round.host_age ? String(round.host_age) : null,
    ]
      .filter(Boolean)
      .join(', ') + ` · ${handicapLine}`;

  return (
    <Pressable
      onPress={onPress}
      style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Typography variant="h3" style={{ flex: 1 }}>
          {round.course_name}
        </Typography>
        <Typography variant="card-distance" color="ink-soft">
          {dateLabel} · {timeLabel}
        </Typography>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: colors['paper-raised'],
          }}
        >
          {round.host_photo_url ? (
            <Image
              source={{ uri: round.host_photo_url }}
              style={{ flex: 1 }}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <Typography variant="body-sm" color="ink-soft" style={{ flex: 1 }}>
          {hostLine}
        </Typography>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Tag size="sm" variant="solid">
          {`${round.seats_open} of ${round.seats_total - 1} open`}
        </Tag>
        <Tag size="sm">{WALKING_LABEL[round.format.walking] ?? '—'}</Tag>
        <Tag size="sm">{MATCH_LABEL[round.format.match_type] ?? '—'}</Tag>
      </View>
    </Pressable>
  );
}

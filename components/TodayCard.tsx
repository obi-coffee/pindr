import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useToast } from './motion/Toast';
import { Button, Tag, Typography, radii, useTheme } from './ui';
import {
  fetchMatchDetails,
  type MatchDetails,
} from '../lib/chat/queries';
import { useHaptics } from '../lib/haptics';
import { useArrival } from '../lib/rounds/today';
import type { RoundWithCourse } from '../lib/rounds/queries';

// Day-of card (Loop Phase D): the first-tee concierge. Who you're
// meeting, where, when — plus "i'm here" (one-shot arrival ping) and a
// straight line back to the chat.

export type TodayCardProps = {
  round: RoundWithCourse;
  userId: string;
};

export function TodayCard({ round, userId }: TodayCardProps) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const haptics = useHaptics();
  const { announced, busy, announce } = useArrival(round.id);
  const [partner, setPartner] = useState<MatchDetails | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!round.origin_match_id) return;
    fetchMatchDetails(round.origin_match_id, userId)
      .then((d) => {
        if (!cancelled) setPartner(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [round.origin_match_id, userId]);

  const tee = new Date(round.tee_time);
  const timeLabel = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleImHere = async () => {
    try {
      await announce();
      haptics.match();
    } catch (err) {
      showToast((err as Error).message, { variant: 'error' });
    }
  };

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.ink,
        backgroundColor: colors['paper-raised'],
        padding: 16,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="ink-subtle">
          TODAY
        </Typography>
        <Tag size="sm" variant="solid">
          locked in
        </Tag>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: colors['paper-high'],
          }}
        >
          {partner?.other_photo_url ? (
            <Image
              source={{ uri: partner.other_photo_url }}
              style={{ flex: 1 }}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="h3">
            {partner?.other_display_name ?? 'your match'}
          </Typography>
          <Typography variant="body-sm" color="ink-soft">
            {round.course.name}
          </Typography>
          <Typography variant="body-sm" color="ink-soft">
            {timeLabel} tee time
          </Typography>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            loading={busy}
            disabled={announced}
            onPress={handleImHere}
          >
            {announced ? "They know you're here." : "I'm here."}
          </Button>
        </View>
        {partner ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push(`/chat/${partner.match_id}` as never)
            }
          >
            Message
          </Button>
        ) : null}
      </View>
    </View>
  );
}

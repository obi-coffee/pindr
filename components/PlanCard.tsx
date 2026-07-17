import { View } from 'react-native';
import { Button, Tag, Typography, radii, useTheme } from './ui';
import type { PlanWithCourse } from '../lib/plans/queries';

export type PlanCardProps = {
  plan: PlanWithCourse;
  /** True when the current user proposed this plan. */
  mine: boolean;
  busy?: boolean;
  onAccept: (plan: PlanWithCourse) => void;
  onDecline: (plan: PlanWithCourse) => void;
  onCancel: (plan: PlanWithCourse) => void;
  onViewRound: (plan: PlanWithCourse) => void;
};

export function PlanCard({
  plan,
  mine,
  busy,
  onAccept,
  onDecline,
  onCancel,
  onViewRound,
}: PlanCardProps) {
  const { colors } = useTheme();

  const tee = new Date(plan.tee_time);
  const dateLabel = tee.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const place =
    [plan.course.city, plan.course.state].filter(Boolean).join(', ') || null;

  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor:
          plan.status === 'accepted' ? colors.ink : colors['stroke-strong'],
        backgroundColor: colors['paper-raised'],
        padding: 16,
        gap: 10,
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
          THE PLAN
        </Typography>
        {plan.status === 'accepted' ? (
          <Tag size="sm" variant="solid">
            locked in
          </Tag>
        ) : null}
      </View>

      <View>
        <Typography variant="h3">{plan.course.name}</Typography>
        {place ? (
          <Typography variant="body-sm" color="ink-soft">
            {place}
          </Typography>
        ) : null}
      </View>

      <Typography variant="body">
        {dateLabel} · {timeLabel}
      </Typography>

      {plan.note ? (
        <Typography variant="body-sm" color="ink-soft">
          {plan.note}
        </Typography>
      ) : null}

      {plan.status === 'proposed' && !mine ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => onDecline(plan)}
          >
            Pass
          </Button>
          <View style={{ flex: 1 }}>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              loading={busy}
              onPress={() => onAccept(plan)}
            >
              Lock it in.
            </Button>
          </View>
        </View>
      ) : null}

      {plan.status === 'proposed' && mine ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 2,
          }}
        >
          <Typography variant="body-sm" color="ink-soft">
            waiting on them.
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => onCancel(plan)}
          >
            Take it back
          </Button>
        </View>
      ) : null}

      {plan.status === 'accepted' ? (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onPress={() => onViewRound(plan)}
        >
          See the round.
        </Button>
      ) : null}

      {plan.status === 'declined' ? (
        <Typography variant="body-sm" color="ink-subtle">
          not this time.
        </Typography>
      ) : null}

      {plan.status === 'cancelled' ? (
        <Typography variant="body-sm" color="ink-subtle">
          taken back.
        </Typography>
      ) : null}
    </View>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from './motion/Toast';
import { Button, Typography, radii, useTheme } from './ui';
import { useHaptics } from '../lib/haptics';
import {
  submitCheckin,
  type CheckinFeel,
} from '../lib/rounds/checkins';
import type { RoundWithCourse } from '../lib/rounds/queries';

// Post-round check-in card (Loop Phase C). Two taps: did it happen →
// how was it / what happened. Good outcomes get a one-tap "run it back"
// that reopens the plan screen pre-filled with the same course, same
// weekday next week.

type Step =
  | 'played'
  | 'feel'
  | 'reason'
  | 'done-great'
  | 'done-fine'
  | 'done-fell-through'
  | 'done-noshow';

export type CheckinCardProps = {
  round: RoundWithCourse;
  userId: string;
  /** Called when the card is finished or dismissed and should disappear. */
  onDismiss: () => void;
};

function nextSameWeekday(teeTimeIso: string): Date {
  const next = new Date(teeTimeIso);
  const now = Date.now();
  while (next.getTime() <= now) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

export function CheckinCard({ round, userId, onDismiss }: CheckinCardProps) {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const haptics = useHaptics();
  const [step, setStep] = useState<Step>('played');
  const [saving, setSaving] = useState(false);

  const tee = new Date(round.tee_time);
  const dateLabel = tee.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const save = async (
    played: boolean,
    feel: CheckinFeel | null,
    nextStep: Step,
  ) => {
    if (saving) return;
    setSaving(true);
    const prevStep = step;
    setStep(nextStep);
    haptics.primaryTap();
    try {
      await submitCheckin({ roundId: round.id, userId, played, feel });
    } catch {
      setStep(prevStep);
      showToast("couldn't save that — mind trying again?", {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const runItBack = () => {
    if (!round.origin_match_id) return;
    const next = nextSameWeekday(round.tee_time);
    const params = new URLSearchParams({
      courseId: round.course.id,
      courseName: round.course.name,
      courseCity: round.course.city ?? '',
      courseState: round.course.state ?? '',
      tee: next.toISOString(),
    });
    onDismiss();
    router.push(`/plan/${round.origin_match_id}?${params.toString()}` as never);
  };

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors['stroke-strong'],
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
          CHECK-IN
        </Typography>
        {step === 'played' ? (
          <Pressable hitSlop={8} onPress={onDismiss}>
            <Typography variant="caption" color="ink-subtle">
              later
            </Typography>
          </Pressable>
        ) : null}
      </View>

      <View>
        <Typography variant="h3">{round.course.name}</Typography>
        <Typography variant="body-sm" color="ink-soft">
          {dateLabel}
        </Typography>
      </View>

      {step === 'played' ? (
        <>
          <Typography variant="body">did it happen?</Typography>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                disabled={saving}
                onPress={() => setStep('feel')}
              >
                We played.
              </Button>
            </View>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onPress={() => setStep('reason')}
            >
              Didn't happen
            </Button>
          </View>
        </>
      ) : null}

      {step === 'feel' ? (
        <>
          <Typography variant="body">how was it?</Typography>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                disabled={saving}
                onPress={() => save(true, 'great', 'done-great')}
              >
                A good one.
              </Button>
            </View>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onPress={() => save(true, 'fine', 'done-fine')}
            >
              It was fine
            </Button>
          </View>
        </>
      ) : null}

      {step === 'reason' ? (
        <>
          <Typography variant="body">what happened?</Typography>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                disabled={saving}
                onPress={() => save(false, null, 'done-fell-through')}
              >
                Plans fell through.
              </Button>
            </View>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onPress={() => save(false, 'noshow', 'done-noshow')}
            >
              They didn't show
            </Button>
          </View>
        </>
      ) : null}

      {step === 'done-great' || step === 'done-fine' ? (
        <>
          <Typography variant="body" color="ink-soft">
            {step === 'done-great'
              ? 'good round. same time next week?'
              : 'logged. same time next week?'}
          </Typography>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onPress={runItBack}
              >
                Run it back.
              </Button>
            </View>
            <Button variant="ghost" size="sm" onPress={onDismiss}>
              Done
            </Button>
          </View>
        </>
      ) : null}

      {step === 'done-fell-through' ? (
        <>
          <Typography variant="body" color="ink-soft">
            no sweat — the chat's still open.
          </Typography>
          <Button variant="ghost" size="sm" fullWidth onPress={onDismiss}>
            Done
          </Button>
        </>
      ) : null}

      {step === 'done-noshow' ? (
        <>
          <Typography variant="body" color="ink-soft">
            logged. sorry about that one.
          </Typography>
          <Button variant="ghost" size="sm" fullWidth onPress={onDismiss}>
            Done
          </Button>
        </>
      ) : null}
    </View>
  );
}

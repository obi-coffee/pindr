import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import {
  Button,
  ChipSelect,
  Input,
  Typography,
  radii,
  useTheme,
} from './ui';
import { CoursePickerModal } from './CoursePickerModal';
import { DateTimeSheet } from './DateTimeSheet';
import { dateToDisplay } from '../lib/format/date';
import type {
  CourseSummary,
  MatchType,
  RoundFormat,
  WalkingChoice,
} from '../lib/rounds/queries';

export type RoundFormValues = {
  course: CourseSummary | null;
  teeTime: Date;
  seatsTotal: 2 | 3 | 4;
  format: RoundFormat;
  notes: string;
};

export type RoundFormProps = {
  initial?: Partial<RoundFormValues>;
  submitLabel: string;
  onSubmit: (values: RoundFormValues) => Promise<void>;
};

const GROUP_OPTIONS: { value: 2 | 3 | 4; label: string }[] = [
  { value: 2, label: 'Twosome' },
  { value: 3, label: 'Threesome' },
  { value: 4, label: 'Foursome' },
];

const WALKING_OPTIONS: { value: WalkingChoice; label: string }[] = [
  { value: 'walk', label: 'Walking' },
  { value: 'ride', label: 'Riding' },
  { value: 'either', label: 'Either' },
];

const MATCH_OPTIONS: { value: MatchType; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'either', label: 'Either' },
];

function defaultTeeTime(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24, 0, 0, 0);
  return d;
}

export function RoundForm({ initial, submitLabel, onSubmit }: RoundFormProps) {
  const { colors } = useTheme();
  const [course, setCourse] = useState<CourseSummary | null>(
    initial?.course ?? null,
  );
  const [teeTime, setTeeTime] = useState<Date>(
    initial?.teeTime ?? defaultTeeTime(),
  );
  const [seatsTotal, setSeatsTotal] = useState<2 | 3 | 4>(
    initial?.seatsTotal ?? 4,
  );
  const [format, setFormat] = useState<RoundFormat>(
    initial?.format ?? { walking: 'either', match_type: 'casual' },
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateLabel = dateToDisplay(teeTime);
  const timeLabel = teeTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleSubmit = async () => {
    if (!course) {
      Alert.alert('pick a course', 'every round needs a course.');
      return;
    }
    if (teeTime.getTime() <= Date.now()) {
      Alert.alert('pick a future tee time', 'tee time must be in the future.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ course, teeTime, seatsTotal, format, notes });
    } catch (err) {
      Alert.alert('could not save', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ padding: 24, paddingBottom: 40, gap: 24 }}>
      <Section label="course">
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            borderWidth: 1,
            borderColor: colors['stroke-strong'],
            borderRadius: radii.md,
            backgroundColor: colors['paper-high'],
            paddingHorizontal: 14,
            paddingVertical: 14,
          }}
        >
          {course ? (
            <>
              <Typography variant="body-lg">{course.name}</Typography>
              <Typography variant="body-sm" color="ink-soft">
                {[course.city, course.state].filter(Boolean).join(', ') || '—'}
              </Typography>
            </>
          ) : (
            <Typography variant="body" color="ink-subtle">
              pick a course
            </Typography>
          )}
        </Pressable>
      </Section>

      <Section label="tee time">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => setDateOpen(true)}
            style={[
              fieldStyle(colors),
              { flex: 1 },
            ]}
          >
            <Typography variant="card-stat-label" color="ink-subtle">
              DATE
            </Typography>
            <Typography variant="body-lg">{dateLabel}</Typography>
          </Pressable>
          <Pressable
            onPress={() => setTimeOpen(true)}
            style={[
              fieldStyle(colors),
              { flex: 1 },
            ]}
          >
            <Typography variant="card-stat-label" color="ink-subtle">
              TIME
            </Typography>
            <Typography variant="body-lg">{timeLabel}</Typography>
          </Pressable>
        </View>
      </Section>

      <Section label="group size">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GROUP_OPTIONS.map((opt) => (
            <ChipSelect
              key={opt.value}
              selected={seatsTotal === opt.value}
              onPress={() => setSeatsTotal(opt.value)}
            >
              {opt.label}
            </ChipSelect>
          ))}
        </View>
      </Section>

      <Section label="walking or riding">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WALKING_OPTIONS.map((opt) => (
            <ChipSelect
              key={opt.value}
              selected={format.walking === opt.value}
              onPress={() =>
                setFormat((f) => ({ ...f, walking: opt.value }))
              }
            >
              {opt.label}
            </ChipSelect>
          ))}
        </View>
      </Section>

      <Section label="match type">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MATCH_OPTIONS.map((opt) => (
            <ChipSelect
              key={opt.value}
              selected={format.match_type === opt.value}
              onPress={() =>
                setFormat((f) => ({ ...f, match_type: opt.value }))
              }
            >
              {opt.label}
            </ChipSelect>
          ))}
        </View>
      </Section>

      <Input
        label="notes"
        placeholder="bringing beers, 9 only, no phones — whatever the hang calls for."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleSubmit}
        loading={submitting}
      >
        {submitLabel}
      </Button>

      <CoursePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setCourse}
      />

      {Platform.OS === 'ios' ? (
        <DateTimeSheet
          visible={dateOpen || timeOpen}
          mode={timeOpen ? 'time' : 'date'}
          value={teeTime}
          minimumDate={timeOpen ? undefined : new Date()}
          onChange={(next) => {
            const merged = new Date(teeTime);
            if (timeOpen) {
              merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
            } else {
              merged.setFullYear(
                next.getFullYear(),
                next.getMonth(),
                next.getDate(),
              );
            }
            setTeeTime(merged);
          }}
          onClose={() => {
            setDateOpen(false);
            setTimeOpen(false);
          }}
        />
      ) : (
        <>
          {dateOpen ? (
            <DateTimePicker
              mode="date"
              display="default"
              value={teeTime}
              minimumDate={new Date()}
              onChange={(_, next) => {
                setDateOpen(false);
                if (next) {
                  const merged = new Date(teeTime);
                  merged.setFullYear(
                    next.getFullYear(),
                    next.getMonth(),
                    next.getDate(),
                  );
                  setTeeTime(merged);
                }
              }}
            />
          ) : null}
          {timeOpen ? (
            <DateTimePicker
              mode="time"
              display="default"
              value={teeTime}
              onChange={(_, next) => {
                setTimeOpen(false);
                if (next) {
                  const merged = new Date(teeTime);
                  merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
                  setTeeTime(merged);
                }
              }}
            />
          ) : null}
        </>
      )}
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
    <View>
      <Typography
        variant="caption"
        color="ink-soft"
        style={{ marginBottom: 10 }}
      >
        {label}
      </Typography>
      {children}
    </View>
  );
}

function fieldStyle(colors: {
  'stroke-strong': string;
  'paper-high': string;
}) {
  return {
    borderWidth: 1,
    borderColor: colors['stroke-strong'],
    borderRadius: radii.md,
    backgroundColor: colors['paper-high'],
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  } as const;
}

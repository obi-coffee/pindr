import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoursePickerModal } from '../../../components/CoursePickerModal';
import { DateTimeSheet } from '../../../components/DateTimeSheet';
import {
  Button,
  Input,
  PindrLogo,
  Typography,
  radii,
  useTheme,
} from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { dateToDisplay } from '../../../lib/format/date';
import { proposePlan } from '../../../lib/plans/queries';
import type { CourseSummary } from '../../../lib/rounds/queries';

function defaultTeeTime(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24, 0, 0, 0);
  return d;
}

export default function ProposePlan() {
  // The optional params are the "run it back" prefill (Loop Phase C):
  // the check-in card reopens this screen with the same course and the
  // same weekday next week already picked.
  const { matchId, courseId, courseName, courseCity, courseState, tee } =
    useLocalSearchParams<{
      matchId: string;
      courseId?: string;
      courseName?: string;
      courseCity?: string;
      courseState?: string;
      tee?: string;
    }>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [course, setCourse] = useState<CourseSummary | null>(() =>
    courseId && courseName
      ? {
          id: courseId,
          name: courseName,
          city: courseCity || null,
          state: courseState || null,
          lng: 0,
          lat: 0,
          distance_km: null,
        }
      : null,
  );
  const [teeTime, setTeeTime] = useState<Date>(() => {
    if (tee) {
      const parsed = new Date(tee);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        return parsed;
      }
    }
    return defaultTeeTime();
  });
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user || !matchId) return null;

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
      await proposePlan({
        matchId,
        proposerId: user.id,
        courseId: course.id,
        teeTime,
        note: note.trim() || null,
      });
      router.back();
    } catch (err) {
      Alert.alert('could not send that', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
          <Typography variant="h1">plan a round</Typography>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 24 }}
        >
          <Typography variant="body" color="ink-soft">
            propose a course and a time. they lock it in, it's a round.
          </Typography>

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
                    {[course.city, course.state].filter(Boolean).join(', ') ||
                      '—'}
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
                style={[fieldStyle(colors), { flex: 1 }]}
              >
                <Typography variant="card-stat-label" color="ink-subtle">
                  DATE
                </Typography>
                <Typography variant="body-lg">{dateLabel}</Typography>
              </Pressable>
              <Pressable
                onPress={() => setTimeOpen(true)}
                style={[fieldStyle(colors), { flex: 1 }]}
              >
                <Typography variant="card-stat-label" color="ink-subtle">
                  TIME
                </Typography>
                <Typography variant="body-lg">{timeLabel}</Typography>
              </Pressable>
            </View>
          </Section>

          <Input
            label="note"
            placeholder="early nine, coffee after — whatever the plan is."
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            loading={submitting}
          >
            Propose it.
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
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

function fieldStyle(colors: { 'stroke-strong': string; 'paper-high': string }) {
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

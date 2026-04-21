import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundForm } from '../../../../components/RoundForm';
import { PindrLogo, Typography, useTheme } from '../../../../components/ui';
import {
  getRound,
  updateRound,
  type CourseSummary,
  type RoundWithCourse,
} from '../../../../lib/rounds/queries';

export default function EditRound() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [round, setRound] = useState<RoundWithCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setRound(await getRound(id));
      } catch {
        setRound(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !round) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center' }}
        edges={['top']}
      >
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

  // RoundForm needs a CourseSummary; reconstruct from embedded course (no distance).
  const initialCourse: CourseSummary = {
    id: round.course.id,
    name: round.course.name,
    city: round.course.city,
    state: round.course.state,
    lng: 0,
    lat: 0,
    distance_km: null,
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
          <PindrLogo height={32} />
          <Typography variant="h1">edit round</Typography>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          <RoundForm
            submitLabel="Save."
            initial={{
              course: initialCourse,
              teeTime: new Date(round.tee_time),
              seatsTotal: round.seats_total as 2 | 3 | 4,
              format: round.format,
              notes: round.notes ?? '',
            }}
            onSubmit={async (values) => {
              await updateRound(round.id, {
                teeTime: values.teeTime,
                seatsTotal: values.seatsTotal,
                format: values.format,
                notes: values.notes.trim() || null,
              });
              router.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

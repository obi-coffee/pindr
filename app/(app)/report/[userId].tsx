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
import {
  Button,
  Input,
  Typography,
  radii,
  useTheme,
} from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  REPORT_REASONS,
  submitReport,
  type ReportReason,
} from '../../../lib/safety/queries';

export default function ReportScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !userId) return;
    if (!reason) {
      Alert.alert('pick a reason', 'tell us what the issue is.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport(user.id, userId, reason, details);
      Alert.alert(
        'report submitted',
        "thanks for letting us know. our team will review this profile.",
        [{ text: 'ok', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert('could not submit', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
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
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.stroke,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Typography variant="caption" color="ink-soft">
              cancel
            </Typography>
          </Pressable>
          <Typography variant="caption" color="ink">
            report
          </Typography>
          <View style={{ minWidth: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Typography variant="h1" style={{ marginBottom: 6 }}>
            what's happening?
          </Typography>
          <Typography variant="body" color="ink-soft" style={{ marginBottom: 24 }}>
            reports are confidential. we review each one.
          </Typography>

          <View style={{ gap: 8, marginBottom: 24 }}>
            {REPORT_REASONS.map((opt) => {
              const on = reason === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setReason(opt.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: on ? colors.ink : colors['stroke-strong'],
                    backgroundColor: on ? colors.ink : colors['paper-high'],
                  }}
                >
                  <Typography
                    variant="body-lg"
                    color={on ? 'paper-high' : 'ink'}
                    style={{ fontWeight: '500' }}
                  >
                    {opt.label}
                  </Typography>
                  {on ? (
                    <Typography variant="caption" color="paper-high">
                      ✓
                    </Typography>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Anything else we should know? (optional)"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            maxLength={1000}
            placeholder="share any details that'll help our team."
          />

          <Button
            variant="destructive"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!reason}
            onPress={submit}
            style={{ marginTop: 12 }}
          >
            Submit report
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

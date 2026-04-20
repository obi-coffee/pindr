import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  REPORT_REASONS,
  submitReport,
  type ReportReason,
} from '../../../lib/safety/queries';

export default function ReportScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !userId) return;
    if (!reason) {
      Alert.alert('Pick a reason', 'Tell us what the issue is.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport(user.id, userId, reason, details);
      Alert.alert(
        'Report submitted',
        "Thanks for letting us know. Our team will review this profile.",
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert('Could not submit', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
          <Pressable onPress={() => router.back()} className="py-2 active:opacity-70">
            <Text className="text-sm font-medium text-slate-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-slate-900">Report</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Text className="mb-2 text-2xl font-bold text-slate-900">
            What's happening?
          </Text>
          <Text className="mb-6 text-base text-slate-500">
            Reports are confidential. We review each one.
          </Text>

          <View className="mb-6 gap-2">
            {REPORT_REASONS.map((opt) => {
              const on = reason === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setReason(opt.value)}
                  className={`flex-row items-center justify-between rounded-lg border px-4 py-3 active:opacity-80 ${
                    on
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-base ${
                      on ? 'font-semibold text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {on ? <Text className="text-emerald-700">✓</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-1 text-sm font-medium text-slate-700">
            Anything else we should know? (optional)
          </Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
            placeholder="Share any details that'll help our team."
            placeholderTextColor="#94a3b8"
            className="mb-6 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Pressable
            onPress={submit}
            disabled={!reason || submitting}
            className={`items-center rounded-lg py-3 ${
              !reason || submitting
                ? 'bg-red-300'
                : 'bg-red-600 active:opacity-80'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {submitting ? 'Submitting…' : 'Submit report'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

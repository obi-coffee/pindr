import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuestionPicker } from '../../../components/QuestionPicker';
import { Button, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  PROFILE_QUESTIONS,
  type ProfileAnswers,
} from '../../../lib/profile/questions';
import { supabase } from '../../../lib/supabase';

export default function EditAnswers() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<ProfileAnswers>(
    () => profile?.profile_answers ?? {},
  );
  const [busy, setBusy] = useState(false);

  // Keep raw text in state during typing — trimming on every
  // keystroke ate the space key. Trim + drop empties at save.
  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const cleaned: ProfileAnswers = {};
      for (const [k, v] of Object.entries(answers)) {
        const trimmed = (v ?? '').trim();
        if (trimmed.length > 0) cleaned[k] = trimmed;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ profile_answers: cleaned })
        .eq('user_id', user.id);
      if (error) throw error;
      await refetchProfile();
      router.back();
    } catch (err) {
      Alert.alert('could not save', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography variant="caption" color="ink-soft">
            cancel
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          questions
        </Typography>
        <View style={{ minWidth: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Typography
          variant="body"
          color="ink-soft"
          style={{ marginBottom: 24 }}
        >
          all optional. we'll show only the ones you answer on your profile.
        </Typography>

        <View style={{ gap: 28 }}>
          {PROFILE_QUESTIONS.map((q) => (
            <QuestionPicker
              key={q.id}
              question={q}
              value={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          onPress={save}
          style={{ marginTop: 32 }}
        >
          Save
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

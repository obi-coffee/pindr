import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../../components/BrandMark';
import { QuestionPicker } from '../../components/QuestionPicker';
import { Button, Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  PROFILE_QUESTIONS,
  type ProfileAnswers,
} from '../../lib/profile/questions';
import { supabase } from '../../lib/supabase';

export default function QuestionsStep() {
  const { user, refetchProfile } = useAuth();
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [busy, setBusy] = useState(false);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        delete next[id];
      } else {
        next[id] = trimmed;
      }
      return next;
    });
  };

  const persist = async (toSave: ProfileAnswers) => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_answers: toSave })
        .eq('user_id', user.id);
      if (error) throw error;
      await refetchProfile();
      router.push('/done');
    } catch (err) {
      Alert.alert('could not save', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingHorizontal: 24,
          paddingTop: 6,
        }}
      >
        <Pressable
          onPress={() => persist({})}
          hitSlop={12}
          disabled={busy}
        >
          <Typography variant="caption" color="ink-soft">
            skip
          </Typography>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <BrandMark />
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 8 }}
        >
          step 7 of 7
        </Typography>
        <Typography variant="h1" style={{ marginBottom: 6 }}>
          a few fun questions.
        </Typography>
        <Typography variant="body" color="ink-soft" style={{ marginBottom: 28 }}>
          all optional. answer none, some, or all — they show up on your full
          profile so people get a feel for who you are out there.
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
          onPress={() => persist(answers)}
          style={{ marginTop: 32 }}
        >
          Save and finish
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

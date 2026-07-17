import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundForm } from '../../../components/RoundForm';
import { PindrLogo, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { maybePromptForPush } from '../../../lib/push/maybePrompt';
import { createRound } from '../../../lib/rounds/queries';

export default function NewRound() {
  const { user } = useAuth();
  const { colors } = useTheme();

  if (!user) return null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Header />
        <ScrollView keyboardShouldPersistTaps="handled">
          <RoundForm
            submitLabel="Post the round."
            onSubmit={async (values) => {
              if (!values.course) return;
              await createRound(user.id, {
                courseId: values.course.id,
                teeTime: values.teeTime,
                seatsTotal: values.seatsTotal,
                format: values.format,
                notes: values.notes.trim() || null,
              });
              void maybePromptForPush(user.id, 'first_round_post');
              router.replace('/rounds/mine');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header() {
  return (
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
      <Typography variant="h1">post a round</Typography>
    </View>
  );
}

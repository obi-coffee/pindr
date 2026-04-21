import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchMatchDetails,
  type MatchDetails,
} from '../../../lib/chat/queries';

export default function SharePlan() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState('');
  const [teeTime, setTeeTime] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!matchId || !user) return;
    (async () => {
      try {
        const d = await fetchMatchDetails(matchId, user.id);
        setDetails(d);
      } catch (err) {
        Alert.alert('could not load match', (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId, user]);

  const share = async () => {
    if (!details) return;
    setSharing(true);
    try {
      const lines: string[] = [
        `playing with ${details.other_display_name ?? 'a match'} from pindr.`,
      ];
      if (course.trim()) lines.push(`📍 ${course.trim()}`);
      if (teeTime.trim()) lines.push(`🕐 ${teeTime.trim()}`);
      if (details.other_photo_url) lines.push(details.other_photo_url);
      lines.push(
        "i'll check in after the round. here's who i'm meeting in case you need it.",
      );
      await Share.share({ message: lines.join('\n\n') });
      router.back();
    } catch (err) {
      Alert.alert('could not share', (err as Error).message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.paper,
        }}
      >
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

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
            paddingTop: 28,
            paddingBottom: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Typography variant="caption" color="ink-soft">
              cancel
            </Typography>
          </Pressable>
          <Typography variant="caption" color="ink">
            share my plans
          </Typography>
          <View style={{ minWidth: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Typography variant="h1" style={{ marginBottom: 6 }}>
            tell a friend where you'll be.
          </Typography>
          <Typography variant="body" color="ink-soft" style={{ marginBottom: 28 }}>
            send {details?.other_display_name ?? 'your match'}'s name and photo
            to someone you trust, along with the course and time. takes ten
            seconds. makes meeting up safer.
          </Typography>

          <Input
            label="Course (optional)"
            value={course}
            onChangeText={setCourse}
            placeholder="Bethpage Black"
            autoCapitalize="words"
          />

          <Input
            label="Tee time (optional)"
            value={teeTime}
            onChangeText={setTeeTime}
            placeholder="Sat 9:40 am"
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={sharing}
            onPress={share}
            style={{ marginTop: 8 }}
          >
            Share with a friend
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

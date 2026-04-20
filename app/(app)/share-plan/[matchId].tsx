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
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchMatchDetails,
  type MatchDetails,
} from '../../../lib/chat/queries';

export default function SharePlan() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
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
        Alert.alert('Could not load match', (err as Error).message);
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
        `Playing golf with ${details.other_display_name ?? 'a match'} from Pindr.`,
      ];
      if (course.trim()) lines.push(`📍 ${course.trim()}`);
      if (teeTime.trim()) lines.push(`🕐 ${teeTime.trim()}`);
      if (details.other_photo_url) lines.push(details.other_photo_url);
      lines.push(
        "I'll check in after the round. Here's who I'm meeting in case you need it.",
      );
      await Share.share({ message: lines.join('\n\n') });
      router.back();
    } catch (err) {
      Alert.alert('Could not share', (err as Error).message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-slate-900">
            Share my plans
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Text className="mb-2 text-2xl font-bold text-slate-900">
            Tell a friend where you'll be
          </Text>
          <Text className="mb-6 text-base text-slate-500">
            Send {details?.other_display_name ?? 'your match'}'s name and photo
            to someone you trust, along with the course and time. Takes ten
            seconds and makes meeting up safer.
          </Text>

          <Text className="mb-1 text-sm font-medium text-slate-700">
            Course (optional)
          </Text>
          <TextInput
            value={course}
            onChangeText={setCourse}
            placeholder="Bethpage Black"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
            className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">
            Tee time (optional)
          </Text>
          <TextInput
            value={teeTime}
            onChangeText={setTeeTime}
            placeholder="Sat 9:40 am"
            placeholderTextColor="#94a3b8"
            className="mb-6 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Pressable
            onPress={share}
            disabled={sharing}
            className={`items-center rounded-lg py-3 ${
              sharing ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {sharing ? 'Opening…' : 'Share with a friend'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

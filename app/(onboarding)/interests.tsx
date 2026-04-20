import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  fetchAllInterests,
  fetchUserInterestIds,
  saveUserInterests,
  type Interest,
} from '../../lib/profile/interests';

const MIN_SELECTIONS = 3;

export default function Interests() {
  const { user } = useAuth();
  const [all, setAll] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previous, setPrevious] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [list, mine] = await Promise.all([
          fetchAllInterests(),
          fetchUserInterestIds(user.id),
        ]);
        setAll(list);
        setPrevious(mine);
        setSelected(new Set(mine));
      } catch (err) {
        Alert.alert('Could not load interests', (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onContinue = async () => {
    if (!user) return;
    if (selected.size < MIN_SELECTIONS) {
      Alert.alert(
        'Pick a few more',
        `Choose at least ${MIN_SELECTIONS} interests so we can find you good matches.`,
      );
      return;
    }
    setSaving(true);
    try {
      await saveUserInterests(user.id, [...selected], previous);
      setPrevious([...selected]);
      router.push('/location');
    } catch (err) {
      Alert.alert('Could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Step 5 of 6
        </Text>
        <Text className="mb-2 text-3xl font-bold text-slate-900">
          What else are you into?
        </Text>
        <Text className="mb-6 text-base text-slate-500">
          Pick at least {MIN_SELECTIONS}. These help you match beyond golf.
        </Text>

        {loading ? (
          <ActivityIndicator color="#059669" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {all.map((interest) => {
              const on = selected.has(interest.id);
              return (
                <Pressable
                  key={interest.id}
                  onPress={() => toggle(interest.id)}
                  className={`rounded-full border px-4 py-2 active:opacity-80 ${
                    on
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      on ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {interest.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onContinue}
          disabled={loading || saving}
          className={`mt-8 items-center rounded-lg py-3 ${
            loading || saving
              ? 'bg-emerald-300'
              : 'bg-emerald-600 active:opacity-80'
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {saving ? 'Saving…' : 'Continue'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="mt-4 items-center py-2 active:opacity-70"
        >
          <Text className="text-sm font-medium text-slate-500">Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

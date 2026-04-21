import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  ChipSelect,
  Typography,
  colors,
} from '../../components/ui';
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
        Alert.alert('could not load interests', (err as Error).message);
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
        'pick a few more',
        `choose at least ${MIN_SELECTIONS} so we can match you beyond golf.`,
      );
      return;
    }
    setSaving(true);
    try {
      await saveUserInterests(user.id, [...selected], previous);
      setPrevious([...selected]);
      router.push('/location');
    } catch (err) {
      Alert.alert('could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 8 }}
        >
          step 5 of 6
        </Typography>
        <Typography variant="h1" style={{ marginBottom: 6 }}>
          what else are you into?
        </Typography>
        <Typography variant="body" color="ink-soft" style={{ marginBottom: 24 }}>
          pick at least {MIN_SELECTIONS}. these help you match beyond the game.
        </Typography>

        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {all.map((interest) => (
              <ChipSelect
                key={interest.id}
                selected={selected.has(interest.id)}
                onPress={() => toggle(interest.id)}
              >
                {interest.name}
              </ChipSelect>
            ))}
          </View>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={loading}
          onPress={onContinue}
          style={{ marginTop: 28 }}
        >
          Continue
        </Button>

        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ alignSelf: 'center', marginTop: 20, paddingVertical: 8 }}
        >
          <Typography variant="caption" color="ink-subtle">
            back
          </Typography>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

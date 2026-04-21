import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChipSelect,
  Typography,
  colors,
} from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  fetchAllInterests,
  fetchUserInterestIds,
  saveUserInterests,
  type Interest,
} from '../../../lib/profile/interests';
import { EditHeader } from './basics';

const MIN_SELECTIONS = 3;

export default function EditInterests() {
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

  const onSave = async () => {
    if (!user) return;
    if (selected.size < MIN_SELECTIONS) {
      Alert.alert(
        'pick a few more',
        `keep at least ${MIN_SELECTIONS} interests.`,
      );
      return;
    }
    setSaving(true);
    try {
      await saveUserInterests(user.id, [...selected], previous);
      router.back();
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
      <EditHeader
        title="edit interests"
        onSave={onSave}
        saving={saving}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
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

        <Typography
          variant="body-sm"
          color="ink-subtle"
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          pick at least {MIN_SELECTIONS}.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

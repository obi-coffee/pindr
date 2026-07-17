import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvailabilityPicker } from '../../../components/AvailabilityPicker';
import { Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  saveAvailability,
  selectedSlots,
  toAvailability,
  type AvailabilitySlotId,
} from '../../../lib/profile/availability';
import { EditHeader } from './basics';

export default function EditAvailability() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedSlots(profile?.availability).map((s) => s.id)),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (id: AvailabilitySlotId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveAvailability(user.id, toAvailability(selected));
      await refetchProfile();
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
      <EditHeader title="edit availability" onSave={onSave} saving={saving} />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Typography variant="body" color="ink-soft" style={{ marginBottom: 20 }}>
          when do you usually play? shows on your profile and in your chats,
          so nobody has to ask.
        </Typography>

        <AvailabilityPicker selected={selected} onToggle={toggle} />

        <Typography
          variant="body-sm"
          color="ink-subtle"
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          pick as many as fit. clear them all to keep it off your profile.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

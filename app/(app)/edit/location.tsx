import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, colors, radii } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { EditHeader } from './basics';

type Fix = {
  latitude: number;
  longitude: number;
  city: string;
};

export default function EditLocation() {
  const { user, profile, refetchProfile } = useAuth();
  const [fix, setFix] = useState<Fix | null>(null);
  const [busy, setBusy] = useState(false);

  const currentCity = profile?.home_city ?? null;

  const getLocation = async () => {
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'location access needed',
          'enable location for pindr in settings.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      let city = 'unknown area';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const first = reverse[0];
        if (first) {
          city = [first.city, first.region].filter(Boolean).join(', ');
        }
      } catch {
        // Non-fatal.
      }
      setFix({ latitude, longitude, city });
    } catch (err) {
      Alert.alert('could not get your location', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!user || !fix) return;
    setBusy(true);
    try {
      const point = `POINT(${fix.longitude} ${fix.latitude})`;
      const { error } = await supabase
        .from('profiles')
        .update({
          home_location: point,
          home_city: fix.city,
        })
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
      edges={['top']}
    >
      <EditHeader
        title="edit location"
        onSave={fix ? onSave : undefined}
        saving={busy && Boolean(fix)}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {currentCity ? (
          <Typography
            variant="body"
            color="ink-soft"
            style={{ marginBottom: 20 }}
          >
            currently in{' '}
            <Typography variant="body" color="ink">
              {currentCity}
            </Typography>
            .
          </Typography>
        ) : null}

        {fix ? (
          <View
            style={{
              marginBottom: 20,
              padding: 16,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors['stroke-strong'],
              backgroundColor: colors['paper-raised'],
            }}
          >
            <Typography variant="caption" color="success">
              new location
            </Typography>
            <Typography variant="h2" style={{ marginTop: 4 }}>
              {fix.city}
            </Typography>
          </View>
        ) : (
          <Pressable
            onPress={getLocation}
            disabled={busy}
            style={{
              paddingVertical: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors['stroke-strong'],
              backgroundColor: colors['paper-raised'],
            }}
          >
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Typography variant="body-lg" style={{ fontWeight: '600' }}>
                use my current location
              </Typography>
            )}
          </Pressable>
        )}

        {fix ? (
          <Pressable
            onPress={() => setFix(null)}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 16, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-subtle">
              try again
            </Typography>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

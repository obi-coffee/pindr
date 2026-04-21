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
import { Button, Typography, colors, radii } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type Fix = {
  latitude: number;
  longitude: number;
  city: string;
};

export default function LocationStep() {
  const { user, refetchProfile } = useAuth();
  const [fix, setFix] = useState<Fix | null>(null);
  const [busy, setBusy] = useState(false);

  const getLocation = async () => {
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'location access needed',
          "enable location for pindr in settings so we can find people nearby.",
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
        // Non-fatal — we still save the point.
      }

      setFix({ latitude, longitude, city });
    } catch (err) {
      Alert.alert('could not get your location', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onContinue = async () => {
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
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 8 }}
        >
          step 6 of 6
        </Typography>
        <Typography variant="h1" style={{ marginBottom: 6 }}>
          where do you play?
        </Typography>
        <Typography variant="body" color="ink-soft" style={{ marginBottom: 28 }}>
          we use your location to surface people nearby. city-level only, never exact.
        </Typography>

        {fix ? (
          <View
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors['stroke-strong'],
              backgroundColor: colors['paper-raised'],
            }}
          >
            <Typography variant="caption" color="success">
              we have you in
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
              marginBottom: 16,
              paddingVertical: 28,
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
              <>
                <Typography variant="body-lg" style={{ fontWeight: '600' }}>
                  use my current location
                </Typography>
                <Typography
                  variant="body-sm"
                  color="ink-subtle"
                  style={{ marginTop: 4 }}
                >
                  granted once, stored city-level only.
                </Typography>
              </>
            )}
          </Pressable>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy && Boolean(fix)}
          disabled={!fix || busy}
          onPress={onContinue}
          style={{ marginTop: 8 }}
        >
          Continue
        </Button>

        {fix ? (
          <Pressable
            onPress={() => setFix(null)}
            hitSlop={8}
            style={{
              alignSelf: 'center',
              marginTop: 16,
              paddingVertical: 8,
            }}
          >
            <Typography variant="caption" color="ink-subtle">
              try again
            </Typography>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 8 }}
        >
          <Typography variant="caption" color="ink-subtle">
            back
          </Typography>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

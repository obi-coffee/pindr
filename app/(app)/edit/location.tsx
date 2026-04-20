import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { supabase } from '../../../lib/supabase';

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
          'Location access needed',
          'Enable location for Pindr in Settings.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      let city = 'Unknown area';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const first = reverse[0];
        if (first) {
          city = [first.city, first.region].filter(Boolean).join(', ');
        }
      } catch {}

      setFix({ latitude, longitude, city });
    } catch (err) {
      Alert.alert('Could not get your location', (err as Error).message);
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
      Alert.alert('Could not save', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="mb-2 text-3xl font-bold text-slate-900">
          Edit location
        </Text>
        {currentCity ? (
          <Text className="mb-6 text-base text-slate-500">
            Current: {currentCity}
          </Text>
        ) : (
          <Text className="mb-6 text-base text-slate-500">
            Set your city-level location.
          </Text>
        )}

        {fix ? (
          <View className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <Text className="text-sm font-medium text-slate-500">
              New location
            </Text>
            <Text className="mt-1 text-xl font-semibold text-slate-900">
              {fix.city}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={getLocation}
            disabled={busy}
            className="mb-4 items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-6 active:opacity-70"
          >
            {busy ? (
              <ActivityIndicator color="#059669" />
            ) : (
              <Text className="text-base font-semibold text-slate-700">
                Use my current location
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={onSave}
          disabled={!fix || busy}
          className={`mt-2 items-center rounded-lg py-3 ${
            !fix || busy
              ? 'bg-emerald-300'
              : 'bg-emerald-600 active:opacity-80'
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {busy ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>

        {fix ? (
          <Pressable
            onPress={() => setFix(null)}
            className="mt-4 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">
              Try again
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.back()}
          className="mt-4 items-center py-2 active:opacity-70"
        >
          <Text className="text-sm font-medium text-slate-500">Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

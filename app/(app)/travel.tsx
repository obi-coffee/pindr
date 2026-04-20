import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  deleteTravelSession,
  fetchActiveOrUpcomingSession,
  saveTravelSession,
  type TravelSession,
} from '../../lib/travel/queries';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TravelScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<TravelSession | null>(null);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await fetchActiveOrUpcomingSession(user.id);
        if (s) {
          setSession(s);
          setCity(s.city);
          setStartDate(s.start_date);
          setEndDate(s.end_date);
        }
      } catch (err) {
        Alert.alert('Could not load travel', (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const lookupCity = async () => {
    if (!city.trim()) {
      Alert.alert('Enter a city first');
      return;
    }
    setBusy(true);
    try {
      const results = await Location.geocodeAsync(city.trim());
      if (results.length === 0) {
        Alert.alert("Couldn't find that city", 'Try a more specific name.');
        return;
      }
      const first = results[0];
      setCoords({ latitude: first.latitude, longitude: first.longitude });
    } catch (err) {
      Alert.alert('Lookup failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!city.trim()) return Alert.alert('Enter a city');
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Alert.alert('Dates must be YYYY-MM-DD');
    }
    if (endDate < startDate) {
      return Alert.alert('End date must be on or after start date');
    }
    if (endDate < todayIso()) {
      return Alert.alert('End date must be today or later');
    }

    // If coords are missing (user edited the city but didn't tap Find), geocode now.
    let finalCoords = coords;
    if (!finalCoords || (session && session.city !== city.trim())) {
      const results = await Location.geocodeAsync(city.trim());
      if (results.length === 0) {
        return Alert.alert("Couldn't find that city", 'Try a more specific name.');
      }
      finalCoords = { latitude: results[0].latitude, longitude: results[0].longitude };
    }

    setBusy(true);
    try {
      await saveTravelSession({
        existingId: session?.id ?? null,
        userId: user.id,
        city: city.trim(),
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
        startDate,
        endDate,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const endTravel = async () => {
    if (!session) return;
    Alert.alert('End travel mode?', 'Discovery will use your home location again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End travel',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteTravelSession(session.id);
            router.back();
          } catch (err) {
            Alert.alert('Could not end travel', (err as Error).message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
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
          <Pressable onPress={() => router.back()} className="py-2 active:opacity-70">
            <Text className="text-sm font-medium text-slate-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-slate-900">Travel mode</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          {session ? (
            <View className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Currently traveling
              </Text>
              <Text className="mt-1 text-lg font-semibold text-slate-900">
                {session.city}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-600">
                {session.start_date} to {session.end_date}
              </Text>
            </View>
          ) : (
            <Text className="mb-6 text-base text-slate-500">
              Set a city and date range to discover players there instead of at
              home.
            </Text>
          )}

          <Text className="mb-1 text-sm font-medium text-slate-700">City</Text>
          <View className="mb-1 flex-row gap-2">
            <TextInput
              value={city}
              onChangeText={(t) => {
                setCity(t);
                setCoords(null);
              }}
              placeholder="Scottsdale, AZ"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
            />
            <Pressable
              onPress={lookupCity}
              disabled={busy}
              className="items-center justify-center rounded-lg border border-slate-300 bg-white px-3 active:opacity-70"
            >
              <Text className="text-sm font-medium text-slate-700">Find</Text>
            </Pressable>
          </View>
          {coords ? (
            <Text className="mb-4 text-xs text-emerald-600">
              Located at {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
            </Text>
          ) : (
            <Text className="mb-4 text-xs text-slate-400">
              Tap Find to geocode, or just tap Save and we'll look it up.
            </Text>
          )}

          <Text className="mb-1 text-sm font-medium text-slate-700">
            Start date
          </Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">End date</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-6 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Pressable
            onPress={save}
            disabled={busy}
            className={`items-center rounded-lg py-3 ${
              busy ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {busy ? 'Saving…' : session ? 'Update travel' : 'Start travel'}
            </Text>
          </Pressable>

          {session ? (
            <Pressable
              onPress={endTravel}
              disabled={busy}
              className="mt-4 items-center rounded-lg border border-red-200 py-3 active:opacity-70"
            >
              <Text className="text-base font-medium text-red-500">
                End travel mode
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

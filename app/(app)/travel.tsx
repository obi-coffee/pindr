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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Input,
  Typography,
  radii,
  useTheme,
} from '../../components/ui';
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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<TravelSession | null>(null);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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
        Alert.alert('could not load travel', (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const lookupCity = async () => {
    if (!city.trim()) {
      Alert.alert('enter a city first');
      return;
    }
    setBusy(true);
    try {
      const results = await Location.geocodeAsync(city.trim());
      if (results.length === 0) {
        Alert.alert("couldn't find that city", 'try a more specific name.');
        return;
      }
      const first = results[0];
      setCoords({ latitude: first.latitude, longitude: first.longitude });
    } catch (err) {
      Alert.alert('lookup failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!city.trim()) return Alert.alert('enter a city');
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Alert.alert('dates must be YYYY-MM-DD');
    }
    if (endDate < startDate) {
      return Alert.alert('end date must be on or after start date');
    }
    if (endDate < todayIso()) {
      return Alert.alert('end date must be today or later');
    }

    let finalCoords = coords;
    if (!finalCoords || (session && session.city !== city.trim())) {
      const results = await Location.geocodeAsync(city.trim());
      if (results.length === 0) {
        return Alert.alert("couldn't find that city", 'try a more specific name.');
      }
      finalCoords = {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
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
      Alert.alert('could not save', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const endTravel = async () => {
    if (!session) return;
    Alert.alert(
      'end travel mode?',
      'discovery will use your home location again.',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'end travel',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteTravelSession(session.id);
              router.back();
            } catch (err) {
              Alert.alert('could not end travel', (err as Error).message);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
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
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.stroke,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Typography variant="caption" color="ink-soft">
              cancel
            </Typography>
          </Pressable>
          <Typography variant="caption" color="ink">
            travel mode
          </Typography>
          <View style={{ minWidth: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          {session ? (
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
                currently traveling
              </Typography>
              <Typography variant="h2" style={{ marginTop: 4 }}>
                {session.city}
              </Typography>
              <Typography variant="body-sm" color="ink-soft" style={{ marginTop: 4 }}>
                {session.start_date} to {session.end_date}
              </Typography>
            </View>
          ) : (
            <Typography
              variant="body-lg"
              color="ink-soft"
              style={{ marginBottom: 24 }}
            >
              set a city and date range to discover players there instead of at home.
            </Typography>
          )}

          <Typography variant="caption" color="ink-soft" style={{ marginBottom: 6 }}>
            City
          </Typography>
          <View
            style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}
          >
            <View style={{ flex: 1 }}>
              <Input
                value={city}
                onChangeText={(t) => {
                  setCity(t);
                  setCoords(null);
                }}
                placeholder="Scottsdale, AZ"
                autoCapitalize="words"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <Pressable
              onPress={lookupCity}
              disabled={busy}
              style={{
                paddingHorizontal: 16,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors['stroke-strong'],
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors['paper-high'],
              }}
            >
              <Typography variant="caption" color="ink">
                find
              </Typography>
            </Pressable>
          </View>
          {coords ? (
            <Typography
              variant="body-sm"
              color="success"
              style={{ marginTop: 4, marginBottom: 16 }}
            >
              located at {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
            </Typography>
          ) : (
            <Typography
              variant="body-sm"
              color="ink-subtle"
              style={{ marginTop: 4, marginBottom: 16 }}
            >
              tap find to geocode, or just tap save — we'll look it up.
            </Typography>
          )}

          <Input
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={busy}
            onPress={save}
            style={{ marginTop: 8 }}
          >
            {session ? 'Update travel' : 'Start travel'}
          </Button>

          {session ? (
            <Button
              variant="destructive"
              size="lg"
              fullWidth
              onPress={endTravel}
              style={{ marginTop: 12 }}
            >
              End travel mode
            </Button>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

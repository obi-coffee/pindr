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
import { CityPickerInput } from '../../components/CityPickerInput';
import {
  Button,
  Input,
  Typography,
  radii,
  useTheme,
} from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  dateToDisplay,
  displayToIso,
  isoToDisplay,
  maskDateInput,
} from '../../lib/format/date';
import {
  deleteTravelSession,
  fetchActiveOrUpcomingSession,
  saveTravelSession,
  type TravelSession,
} from '../../lib/travel/queries';

export default function TravelScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<TravelSession | null>(null);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState(dateToDisplay(new Date()));
  const [endDate, setEndDate] = useState(dateToDisplay(new Date()));
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
          setStartDate(isoToDisplay(s.start_date));
          setEndDate(isoToDisplay(s.end_date));
        }
      } catch (err) {
        Alert.alert('could not load travel', (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!city.trim()) return Alert.alert('enter a city');
    const startIso = displayToIso(startDate);
    const endIso = displayToIso(endDate);
    if (!startIso || !endIso) {
      return Alert.alert('dates must be MM-DD-YYYY');
    }
    if (endIso < startIso) {
      return Alert.alert('end date must be on or after start date');
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (endIso < todayIso) {
      return Alert.alert('end date must be today or later');
    }

    let finalCoords = coords;
    if (!finalCoords || (session && session.city !== city.trim())) {
      const results = await Location.geocodeAsync(city.trim());
      if (results.length === 0) {
        return Alert.alert(
          "couldn't find that city",
          'try picking one from the list.',
        );
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
        startDate: startIso,
        endDate: endIso,
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
            paddingTop: 28,
            paddingBottom: 12,
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

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
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
              <Typography
                variant="body-sm"
                color="ink-soft"
                style={{ marginTop: 4 }}
              >
                {isoToDisplay(session.start_date)} to{' '}
                {isoToDisplay(session.end_date)}
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

          <CityPickerInput
            label="City"
            value={city}
            onChangeText={(t) => {
              setCity(t);
              setCoords(null);
            }}
            onSelect={(r) => {
              setCity(r.city);
              setCoords({ latitude: r.latitude, longitude: r.longitude });
            }}
            placeholder="Scottsdale, AZ"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Input
            label="Start date"
            value={startDate}
            onChangeText={(t) => setStartDate(maskDateInput(t))}
            placeholder="MM-DD-YYYY"
            keyboardType="number-pad"
            maxLength={10}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="End date"
            value={endDate}
            onChangeText={(t) => setEndDate(maskDateInput(t))}
            placeholder="MM-DD-YYYY"
            keyboardType="number-pad"
            maxLength={10}
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

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_FILTERS,
  loadFilters,
  saveFilters,
  type DiscoverFilters,
  type PlayStyleFilter,
} from '../../lib/discover/filters';

const DISTANCE_OPTIONS = [10, 25, 50, 100, 200];
const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary'];
const PLAY_STYLE_OPTIONS: { value: PlayStyleFilter; label: string }[] = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'competitive', label: 'Competitive' },
];

export default function FiltersScreen() {
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFilters().then((f) => {
      setFilters(f);
      setReady(true);
    });
  }, []);

  const set = <K extends keyof DiscoverFilters>(
    key: K,
    value: DiscoverFilters[K],
  ) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const toggleGender = (gender: string) => {
    setFilters((f) => {
      const current = f.genders ?? [];
      const next = current.includes(gender)
        ? current.filter((g) => g !== gender)
        : [...current, gender];
      return { ...f, genders: next.length === 0 ? null : next };
    });
  };

  const togglePlayStyle = (style: PlayStyleFilter) => {
    setFilters((f) => {
      const current = f.playStyles ?? [];
      const next = current.includes(style)
        ? current.filter((s) => s !== style)
        : [...current, style];
      return { ...f, playStyles: next.length === 0 ? null : next };
    });
  };

  const apply = async () => {
    await saveFilters(filters);
    router.back();
  };

  const reset = () => setFilters(DEFAULT_FILTERS);

  if (!ready) return null;

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
          <Text className="text-base font-semibold text-slate-900">Filters</Text>
          <Pressable onPress={reset} className="py-2 active:opacity-70">
            <Text className="text-sm font-medium text-slate-500">Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Section title="Maximum distance">
            <View className="flex-row flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((km) => {
                const on = filters.maxDistanceKm === km;
                return (
                  <Pressable
                    key={km}
                    onPress={() => set('maxDistanceKm', km)}
                    className={`rounded-full border px-4 py-2 active:opacity-80 ${
                      on ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${on ? 'text-white' : 'text-slate-700'}`}>
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Age range">
            <View className="flex-row items-center gap-3">
              <NumberField
                label="Min"
                value={filters.minAge}
                onChange={(n) => set('minAge', n)}
              />
              <Text className="text-slate-400">to</Text>
              <NumberField
                label="Max"
                value={filters.maxAge}
                onChange={(n) => set('maxAge', n)}
              />
            </View>
          </Section>

          <Section title="Handicap range">
            <View className="flex-row items-center gap-3">
              <NumberField
                label="Min"
                value={filters.minHandicap}
                onChange={(n) => set('minHandicap', n)}
                decimal
              />
              <Text className="text-slate-400">to</Text>
              <NumberField
                label="Max"
                value={filters.maxHandicap}
                onChange={(n) => set('maxHandicap', n)}
                decimal
              />
            </View>
            <Text className="mt-1 text-xs text-slate-400">
              Excludes players without a handicap.
            </Text>
          </Section>

          <Section title="Gender">
            <View className="flex-row flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => {
                const on = filters.genders?.includes(g) ?? false;
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGender(g)}
                    className={`rounded-full border px-4 py-2 active:opacity-80 ${
                      on ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${on ? 'text-white' : 'text-slate-700'}`}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Play style">
            <View className="flex-row flex-wrap gap-2">
              {PLAY_STYLE_OPTIONS.map((opt) => {
                const on = filters.playStyles?.includes(opt.value) ?? false;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => togglePlayStyle(opt.value)}
                    className={`rounded-full border px-4 py-2 active:opacity-80 ${
                      on ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${on ? 'text-white' : 'text-slate-700'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Women-only">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-4 text-sm text-slate-600">
                Only show profiles that self-identify as women.
              </Text>
              <Switch
                value={filters.womenOnly}
                onValueChange={(v) => set('womenOnly', v)}
              />
            </View>
          </Section>

          <Pressable
            onPress={apply}
            className="mt-6 items-center rounded-lg bg-emerald-600 py-3 active:opacity-80"
          >
            <Text className="text-base font-semibold text-white">Apply</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      {children}
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  decimal?: boolean;
}) {
  return (
    <View className="flex-1">
      <TextInput
        value={value === null || Number.isNaN(value) ? '' : String(value)}
        onChangeText={(t) => {
          if (t === '') return onChange(null);
          const n = Number(t);
          onChange(Number.isNaN(n) ? null : n);
        }}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder={label}
        placeholderTextColor="#94a3b8"
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
      />
    </View>
  );
}

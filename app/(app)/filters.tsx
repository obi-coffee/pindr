import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  ChipSelect,
  Input,
  Typography,
  useTheme,
} from '../../components/ui';
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
  const { colors } = useTheme();
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
            filters
          </Typography>
          <Pressable onPress={reset} hitSlop={8}>
            <Typography variant="caption" color="ink-soft">
              reset
            </Typography>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="distance">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DISTANCE_OPTIONS.map((km) => (
                <ChipSelect
                  key={km}
                  selected={filters.maxDistanceKm === km}
                  onPress={() => set('maxDistanceKm', km)}
                >
                  {`${km} km`}
                </ChipSelect>
              ))}
            </View>
          </Section>

          <Section title="age">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <NumberInput
                  value={filters.minAge}
                  onChange={(n) => set('minAge', n)}
                  placeholder="Min"
                />
              </View>
              <Typography variant="body-sm" color="ink-subtle">
                to
              </Typography>
              <View style={{ flex: 1 }}>
                <NumberInput
                  value={filters.maxAge}
                  onChange={(n) => set('maxAge', n)}
                  placeholder="Max"
                />
              </View>
            </View>
          </Section>

          <Section
            title="handicap"
            hint="excludes people without a handicap."
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <NumberInput
                  value={filters.minHandicap}
                  onChange={(n) => set('minHandicap', n)}
                  placeholder="Min"
                  decimal
                />
              </View>
              <Typography variant="body-sm" color="ink-subtle">
                to
              </Typography>
              <View style={{ flex: 1 }}>
                <NumberInput
                  value={filters.maxHandicap}
                  onChange={(n) => set('maxHandicap', n)}
                  placeholder="Max"
                  decimal
                />
              </View>
            </View>
          </Section>

          <Section title="gender">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GENDER_OPTIONS.map((g) => (
                <ChipSelect
                  key={g}
                  selected={filters.genders?.includes(g) ?? false}
                  onPress={() => toggleGender(g)}
                >
                  {g}
                </ChipSelect>
              ))}
            </View>
          </Section>

          <Section title="play style">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PLAY_STYLE_OPTIONS.map((opt) => (
                <ChipSelect
                  key={opt.value}
                  selected={filters.playStyles?.includes(opt.value) ?? false}
                  onPress={() => togglePlayStyle(opt.value)}
                >
                  {opt.label}
                </ChipSelect>
              ))}
            </View>
          </Section>

          <Section title="women only">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <Typography
                variant="body"
                color="ink-soft"
                style={{ flex: 1, paddingRight: 16 }}
              >
                only show people who self-identify as women.
              </Typography>
              <Switch
                value={filters.womenOnly}
                onValueChange={(v) => set('womenOnly', v)}
                trackColor={{
                  false: colors['stroke-strong'],
                  true: colors.ink,
                }}
              />
            </View>
          </Section>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={apply}
            style={{ marginTop: 12 }}
          >
            Apply
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Typography
        variant="caption"
        color="ink-soft"
        style={{ marginBottom: 12 }}
      >
        {title}
      </Typography>
      {children}
      {hint ? (
        <Typography
          variant="body-sm"
          color="ink-subtle"
          style={{ marginTop: 6 }}
        >
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  decimal,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  placeholder: string;
  decimal?: boolean;
}) {
  return (
    <Input
      value={value === null || Number.isNaN(value) ? '' : String(value)}
      onChangeText={(t) => {
        if (t === '') return onChange(null);
        const n = Number(t);
        onChange(Number.isNaN(n) ? null : n);
      }}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      placeholder={placeholder}
      containerStyle={{ marginBottom: 0 }}
    />
  );
}

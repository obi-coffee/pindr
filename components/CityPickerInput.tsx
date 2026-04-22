import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { searchCities, type GeocodeResult } from '../lib/geo/geocode';
import { Input, Typography, radii, useTheme, type InputProps } from './ui';

export type CityPickerValue = {
  city: string;
  latitude: number;
  longitude: number;
};

type Props = Omit<InputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (result: CityPickerValue) => void;
};

export function CityPickerInput({
  value,
  onChangeText,
  onSelect,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const suppressNextFetchRef = useRef(false);

  useEffect(() => {
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (trimmed === lastQueryRef.current) return;
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await searchCities(trimmed, ctrl.signal);
        if (ctrl.signal.aborted) return;
        lastQueryRef.current = trimmed;
        setResults(res);
        setOpen(res.length > 0);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // swallow — user can retry by typing more
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [value]);

  const handleSelect = (r: GeocodeResult) => {
    suppressNextFetchRef.current = true;
    lastQueryRef.current = r.city;
    onChangeText(r.city);
    onSelect({
      city: r.city,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    setOpen(false);
    setResults([]);
  };

  return (
    <View>
      <View>
        <Input
          {...rest}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            if (t.trim().length < 2) {
              setOpen(false);
              setResults([]);
            }
          }}
          containerStyle={{
            ...rest.containerStyle,
            marginBottom: open ? 0 : (rest.containerStyle?.marginBottom ?? 16),
          }}
        />
        {loading ? (
          <View style={{ position: 'absolute', right: 12, top: 40 }}>
            <ActivityIndicator size="small" color={colors.ink} />
          </View>
        ) : null}
      </View>
      {open && results.length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors['stroke-strong'],
            borderTopWidth: 0,
            borderBottomLeftRadius: radii.md,
            borderBottomRightRadius: radii.md,
            backgroundColor: colors['paper-high'],
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          {results.map((r, i) => (
            <Pressable
              key={`${r.latitude}-${r.longitude}-${i}`}
              onPress={() => handleSelect(r)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.stroke,
                backgroundColor: pressed
                  ? colors['paper-raised']
                  : 'transparent',
              })}
            >
              <Typography variant="body">{r.label}</Typography>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

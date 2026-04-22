import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  searchCourses,
  type CourseSummary,
} from '../lib/rounds/queries';
import { Input, Typography, radii, useTheme, type InputProps } from './ui';

type Props = Omit<InputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (course: CourseSummary) => void;
};

export function CoursePickerInput({
  value,
  onChangeText,
  onSelect,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [results, setResults] = useState<CourseSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef<string>('');
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
      setLoading(true);
      try {
        const rows = await searchCourses(trimmed);
        lastQueryRef.current = trimmed;
        setResults(rows);
        setOpen(rows.length > 0);
      } catch {
        // swallow; user can keep typing
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  const handleSelect = (c: CourseSummary) => {
    suppressNextFetchRef.current = true;
    lastQueryRef.current = c.name;
    onChangeText(c.name);
    onSelect?.(c);
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
          {results.slice(0, 5).map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => handleSelect(c)}
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
              <Typography variant="body">{c.name}</Typography>
              <Typography variant="body-sm" color="ink-soft">
                {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                {c.distance_km !== null
                  ? ` · ${Math.max(1, Math.round(c.distance_km * 0.621))} mi`
                  : ''}
              </Typography>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

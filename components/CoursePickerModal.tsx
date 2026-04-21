import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, fontFamilyFor, radii, useTheme } from './ui';
import {
  searchCourses,
  type CourseSummary,
} from '../lib/rounds/queries';

export type CoursePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (course: CourseSummary) => void;
};

export function CoursePickerModal({
  visible,
  onClose,
  onSelect,
}: CoursePickerModalProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const rows = await searchCourses(query);
        setResults(rows);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.paper }}
        edges={['top']}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 6,
            paddingBottom: 12,
          }}
        >
          <Typography variant="h2">pick a course</Typography>
          <Pressable hitSlop={12} onPress={onClose}>
            <Typography variant="caption" color="ink">
              close
            </Typography>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="search by name"
            placeholderTextColor={colors['ink-subtle']}
            style={{
              borderWidth: 1,
              borderColor: colors['stroke-strong'],
              borderRadius: radii.md,
              backgroundColor: colors['paper-high'],
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 17,
              fontFamily: fontFamilyFor('400'),
              color: colors.ink,
            }}
          />
        </View>

        {loading ? (
          <View style={{ paddingTop: 12, alignItems: 'center' }}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={() =>
            !loading && query.trim().length >= 2 ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                <Typography variant="body" color="ink-soft">
                  no courses match that. try a different name.
                </Typography>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderColor: colors.stroke,
              }}
            >
              <Typography variant="body-lg">{item.name}</Typography>
              <Typography variant="body-sm" color="ink-soft">
                {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                {item.distance_km !== null
                  ? ` · ${Math.max(1, Math.round(item.distance_km * 0.621))} mi`
                  : ''}
              </Typography>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

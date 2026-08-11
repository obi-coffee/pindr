import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { fetchRegulars, type Regular } from '../../lib/regulars';

// The community roster for the caller's own home course. Not a deck:
// matches and already-swiped people stay visible (Step 0 decision) —
// blocks are the tool for "I don't want to see this person," and the
// RPC enforces them in both directions.
export default function Regulars() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [regulars, setRegulars] = useState<Regular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRegulars(await fetchRegulars());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const courseName = profile?.home_course_name?.toLowerCase() ?? 'your course';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.stroke,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Typography variant="h2" color="ink">
            ‹
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          the regulars
        </Typography>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Typography
            variant="body"
            color="burgundy"
            style={{ textAlign: 'center' }}
          >
            {error}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={regulars}
          keyExtractor={(r) => r.user_id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={() =>
            regulars.length > 0 ? (
              <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                <Typography variant="body" color="ink-soft">
                  {regulars.length === 1
                    ? `1 regular calls ${courseName} home`
                    : `${regulars.length} regulars call ${courseName} home`}
                </Typography>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 80,
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <Typography variant="body" color="ink-soft" style={{ textAlign: 'center' }}>
                no regulars yet — you&apos;re early.
              </Typography>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/profile/${item.user_id}` as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderColor: colors.stroke,
              }}
            >
              {item.photo_urls[0] ? (
                <Image
                  source={{ uri: item.photo_urls[0] }}
                  style={{ width: 48, height: 48, borderRadius: 999 }}
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: colors['paper-raised'],
                    borderWidth: 1,
                    borderColor: colors.stroke,
                  }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Typography variant="body-lg">
                  {item.display_name ?? '—'}
                  {item.age != null ? `, ${item.age}` : ''}
                </Typography>
                {item.pronouns ? (
                  <Typography variant="body-sm" color="ink-soft">
                    {item.pronouns}
                  </Typography>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

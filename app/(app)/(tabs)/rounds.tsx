import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundListRow } from '../../../components/RoundListRow';
import {
  RoundsFilterBar,
  presetRange,
  type RoundsFilters,
} from '../../../components/RoundsFilterBar';
import { PindrLogo, Typography, useTheme } from '../../../components/ui';
import {
  listOpenRounds,
  type RoundListItem,
} from '../../../lib/rounds/queries';

const DEFAULT_FILTERS: RoundsFilters = {
  preset: '30d',
  course: null,
};

export default function Rounds() {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<RoundsFilters>(DEFAULT_FILTERS);
  const [rounds, setRounds] = useState<RoundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (next: RoundsFilters, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const { from, to } = presetRange(next.preset);
        const data = await listOpenRounds({
          courseId: next.course?.id ?? null,
          from,
          to,
        });
        setRounds(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load(filters);
    }, [load, filters]),
  );

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  return (
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
          paddingBottom: 10,
        }}
      >
        <PindrLogo height={35} />
        <Typography variant="h1">rounds</Typography>
      </View>

      <RoundsFilterBar value={filters} onChange={setFilters} />

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
            couldn't load rounds. check your signal and try again?
          </Typography>
        </View>
      ) : (
        <FlatList
          data={rounds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(filters, true)}
              tintColor={colors.ink}
            />
          }
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.stroke,
                marginHorizontal: 20,
              }}
            />
          )}
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 80,
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <Typography variant="display-lg" style={{ textAlign: 'center' }}>
                no rounds{'\n'}in range.
              </Typography>
              <View style={{ height: 12 }} />
              <Typography
                variant="body"
                color="ink-soft"
                style={{ textAlign: 'center' }}
              >
                widen the date range, or post one yourself.
              </Typography>
            </View>
          )}
          renderItem={({ item }) => (
            <RoundListRow
              round={item}
              onPress={() => router.push(`/rounds/${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

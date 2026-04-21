import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  listMyRounds,
  type RoundWithCourse,
} from '../../../lib/rounds/queries';

export default function MyRounds() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [rounds, setRounds] = useState<RoundWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        setLoading(true);
        try {
          setRounds(await listMyRounds(user.id));
        } catch {
          setRounds([]);
        } finally {
          setLoading(false);
        }
      })();
    }, [user]),
  );

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
          paddingBottom: 12,
        }}
      >
        <Typography variant="h1">your rounds</Typography>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Typography variant="caption" color="ink">
            back
          </Typography>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : rounds.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Typography variant="display-lg" style={{ textAlign: 'center' }}>
            no rounds yet.
          </Typography>
          <View style={{ height: 12 }} />
          <Typography
            variant="body"
            color="ink-soft"
            style={{ textAlign: 'center', marginBottom: 24 }}
          >
            pick a course and pull up.
          </Typography>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.push('/rounds/new')}
          >
            Post a round.
          </Button>
        </View>
      ) : (
        <FlatList
          data={rounds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.stroke,
                marginHorizontal: 20,
              }}
            />
          )}
          ListFooterComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Button
                variant="primary"
                size="lg"
                onPress={() => router.push('/rounds/new')}
              >
                Post another.
              </Button>
            </View>
          )}
          renderItem={({ item }) => <RoundRow round={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function RoundRow({ round }: { round: RoundWithCourse }) {
  const { colors } = useTheme();
  const tee = new Date(round.tee_time);
  const dateLabel = tee.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const statusColor =
    round.status === 'cancelled'
      ? colors.burgundy
      : round.status === 'completed'
        ? colors['ink-subtle']
        : colors['ink-soft'];

  return (
    <Pressable
      onPress={() => router.push(`/rounds/${round.id}` as never)}
      style={{ paddingHorizontal: 20, paddingVertical: 14 }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <Typography variant="h3" style={{ flex: 1, marginRight: 8 }}>
          {round.course.name}
        </Typography>
        <Typography variant="caption" color="ink-subtle">
          {round.seats_open} OPEN
        </Typography>
      </View>
      <Typography variant="body-sm" color="ink-soft">
        {dateLabel} · {timeLabel}
      </Typography>
      <Typography
        variant="caption"
        style={{ color: statusColor, marginTop: 4 }}
      >
        {round.status}
      </Typography>
    </Pressable>
  );
}

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Tag, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  cancelRound,
  deleteRound,
  getRound,
  type RoundWithCourse,
} from '../../../lib/rounds/queries';

const WALKING_LABEL: Record<string, string> = {
  walk: 'Walking',
  ride: 'Riding',
  either: 'Walk or ride',
};
const MATCH_LABEL: Record<string, string> = {
  casual: 'Casual',
  competitive: 'Competitive',
  either: 'Either',
};

export default function RoundDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [round, setRound] = useState<RoundWithCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          setRound(await getRound(id));
        } catch {
          setRound(null);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center' }}
        edges={['top']}
      >
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!round) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.paper, padding: 24 }}
        edges={['top']}
      >
        <Typography variant="body" color="burgundy">
          couldn't load this round.
        </Typography>
      </SafeAreaView>
    );
  }

  const tee = new Date(round.tee_time);
  const dateLabel = tee.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = tee.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const isHost = user?.id === round.host_user_id;
  const isCancellable = round.status === 'open' || round.status === 'full';

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
        <Typography variant="h1">the round</Typography>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Typography variant="caption" color="ink">
            back
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 20 }}>
        <View>
          <Typography variant="display-lg">{round.course.name}</Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginTop: 4 }}
          >
            {[round.course.city, round.course.state].filter(Boolean).join(', ') ||
              '—'}
          </Typography>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 24,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.stroke,
          }}
        >
          <Stat label="Date" value={dateLabel} />
          <Stat label="Tee" value={timeLabel} />
          <Stat
            label="Seats"
            value={`${round.seats_open} of ${round.seats_total - 1}`}
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Tag size="sm">{WALKING_LABEL[round.format.walking] ?? '—'}</Tag>
          <Tag size="sm">{MATCH_LABEL[round.format.match_type] ?? '—'}</Tag>
          {round.status !== 'open' ? (
            <Tag size="sm" variant="solid">
              {round.status}
            </Tag>
          ) : null}
        </View>

        {round.notes ? (
          <View>
            <Typography
              variant="caption"
              color="ink-soft"
              style={{ marginBottom: 6 }}
            >
              FROM THE HOST
            </Typography>
            <Typography variant="body-lg">{round.notes}</Typography>
          </View>
        ) : null}

        {isHost ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.push(`/rounds/${round.id}/edit` as never)}
            >
              Edit round.
            </Button>
            {isCancellable ? (
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onPress={() => confirmCancel(round.id)}
              >
                Cancel round.
              </Button>
            ) : null}
            <Button
              variant="destructive"
              size="lg"
              fullWidth
              onPress={() => confirmDelete(round.id)}
            >
              Delete.
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Typography variant="card-stat-label" color="ink-subtle">
        {label}
      </Typography>
      <Typography variant="card-stat-value">{value}</Typography>
    </View>
  );
}

function confirmCancel(id: string) {
  Alert.alert(
    'cancel this round?',
    'your requests get cancelled. this can\'t be undone.',
    [
      { text: 'keep it', style: 'cancel' },
      {
        text: 'cancel round',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRound(id);
            router.replace('/rounds/mine');
          } catch (err) {
            Alert.alert('could not cancel', (err as Error).message);
          }
        },
      },
    ],
  );
}

function confirmDelete(id: string) {
  Alert.alert('delete this round?', 'this removes it entirely.', [
    { text: 'keep it', style: 'cancel' },
    {
      text: 'delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteRound(id);
          router.replace('/rounds/mine');
        } catch (err) {
          Alert.alert('could not delete', (err as Error).message);
        }
      },
    },
  ]);
}

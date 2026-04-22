import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../../components/motion/Toast';
import { Button, PindrLogo, Tag, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  cancelRound,
  deleteRound,
  getMyRequestForRound,
  getRound,
  listRequestsForRound,
  requestToJoinRound,
  respondToRequest,
  withdrawRequest,
  type MyRoundRequest,
  type PendingRequest,
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
  const { show: showToast } = useToast();
  const [round, setRound] = useState<RoundWithCourse | null>(null);
  const [myRequest, setMyRequest] = useState<MyRoundRequest | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const failToast = useCallback(
    () => showToast("couldn't save that — mind trying again?", { variant: 'error' }),
    [showToast],
  );

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const r = await getRound(id);
      setRound(r);
      if (r.host_user_id === user.id) {
        setRequests(await listRequestsForRound(id));
        setMyRequest(null);
      } else {
        setMyRequest(await getMyRequestForRound(id, user.id));
        setRequests([]);
      }
    } catch {
      setRound(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Optimistic request: flip myRequest to a synthetic pending row
  // immediately. On success, onReload pulls the real row (which the
  // server assigned a real id). On failure, revert + toast.
  const handleRequest = useCallback(async () => {
    if (!round || !user) return;
    const prevMyRequest = myRequest;
    const tempRequest: MyRoundRequest = {
      id: `temp-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      responded_at: null,
    };
    setMyRequest(tempRequest);
    try {
      await requestToJoinRound(round, user.id);
      load();
    } catch {
      setMyRequest(prevMyRequest);
      failToast();
    }
  }, [round, user, myRequest, load, failToast]);

  // Optimistic withdraw: flip status locally, then reconcile via reload.
  const handleWithdraw = useCallback(
    async (requestId: string) => {
      const prevMyRequest = myRequest;
      setMyRequest((prev) =>
        prev && prev.id === requestId ? { ...prev, status: 'withdrawn' } : prev,
      );
      try {
        await withdrawRequest(requestId);
        load();
      } catch {
        setMyRequest(prevMyRequest);
        failToast();
      }
    },
    [myRequest, load, failToast],
  );

  // Optimistic host response: update the request's status in the local
  // list immediately. Reload reconciles; rollback on failure.
  const handleRespond = useCallback(
    async (requestId: string, accept: boolean) => {
      const prevRequests = requests;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: accept ? 'accepted' : 'declined' }
            : r,
        ),
      );
      try {
        await respondToRequest(requestId, accept);
        load();
      } catch {
        setRequests(prevRequests);
        failToast();
      }
    },
    [requests, load, failToast],
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

  if (!round || !user) {
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
  const isHost = user.id === round.host_user_id;
  const isCancellable = round.status === 'open' || round.status === 'full';

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
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
        <Typography variant="h1">the round</Typography>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 20 }}>
        <View>
          <Typography variant="display-lg">{round.course.name}</Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginTop: 4 }}
          >
            {[round.course.city, round.course.state].filter(Boolean).join(', ') || '—'}
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
            <Typography variant="caption" color="ink-soft" style={{ marginBottom: 6 }}>
              FROM THE HOST
            </Typography>
            <Typography variant="body-lg">{round.notes}</Typography>
          </View>
        ) : null}

        {isHost ? (
          <HostActions
            round={round}
            pending={pendingRequests}
            other={otherRequests}
            onRespond={handleRespond}
            isCancellable={isCancellable}
          />
        ) : (
          <RequesterActions
            round={round}
            myRequest={myRequest}
            onRequest={handleRequest}
            onWithdraw={handleWithdraw}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HostActions({
  round,
  pending,
  other,
  onRespond,
  isCancellable,
}: {
  round: RoundWithCourse;
  pending: PendingRequest[];
  other: PendingRequest[];
  onRespond: (requestId: string, accept: boolean) => void;
  isCancellable: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
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

      <View style={{ marginTop: 8 }}>
        <Typography variant="caption" color="ink-soft" style={{ marginBottom: 10 }}>
          REQUESTS
        </Typography>
        {pending.length === 0 && other.length === 0 ? (
          <Typography variant="body" color="ink-subtle">
            no requests yet. sit tight.
          </Typography>
        ) : null}
        {pending.map((r) => (
          <PendingRow key={r.id} req={r} onRespond={onRespond} />
        ))}
        {other.length > 0 ? (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderColor: colors.stroke,
              gap: 8,
            }}
          >
            {other.map((r) => (
              <ResolvedRow key={r.id} req={r} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PendingRow({
  req,
  onRespond,
}: {
  req: PendingRequest;
  onRespond: (requestId: string, accept: boolean) => void;
}) {
  const { colors } = useTheme();
  const handicap =
    req.requester_has_handicap && req.requester_handicap !== null
      ? `${req.requester_handicap.toFixed(1)} handicap`
      : 'no handicap set';
  const name = req.requester_display_name ?? 'Unnamed';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: colors['paper-raised'],
        }}
      >
        {req.requester_photo_url ? (
          <Image
            source={{ uri: req.requester_photo_url }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="h3">
          {name}
          {req.requester_age ? `, ${req.requester_age}` : ''}
        </Typography>
        <Typography variant="body-sm" color="ink-soft">
          {handicap}
        </Typography>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => onRespond(req.id, false)}
        >
          Pass
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={() => onRespond(req.id, true)}
        >
          Accept
        </Button>
      </View>
    </View>
  );
}

function ResolvedRow({ req }: { req: PendingRequest }) {
  const name = req.requester_display_name ?? 'Unnamed';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Typography variant="body" style={{ flex: 1 }}>
        {name}
      </Typography>
      <Tag size="sm" variant={req.status === 'accepted' ? 'solid' : 'outline'}>
        {req.status}
      </Tag>
    </View>
  );
}

function RequesterActions({
  round,
  myRequest,
  onRequest,
  onWithdraw,
}: {
  round: RoundWithCourse;
  myRequest: MyRoundRequest | null;
  onRequest: () => void;
  onWithdraw: (requestId: string) => void;
}) {
  if (round.status === 'cancelled') {
    return (
      <View style={{ gap: 10 }}>
        <Typography variant="body" color="ink-soft">
          the host cancelled this round.
        </Typography>
      </View>
    );
  }

  if (!myRequest || myRequest.status === 'withdrawn') {
    const isFull = round.status === 'full' || round.seats_open === 0;
    return (
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={isFull}
        onPress={onRequest}
      >
        {isFull ? 'Round is full.' : 'Request this round.'}
      </Button>
    );
  }

  if (myRequest.status === 'pending') {
    return (
      <View style={{ gap: 10 }}>
        <Typography variant="body" color="ink-soft">
          requested · waiting on the host.
        </Typography>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onPress={() => onWithdraw(myRequest.id)}
        >
          Withdraw request.
        </Button>
      </View>
    );
  }

  if (myRequest.status === 'accepted') {
    return (
      <View style={{ gap: 8 }}>
        <Tag size="md" variant="solid">
          you're in
        </Tag>
        <Typography variant="body" color="ink-soft">
          the host locked you in. tee off {new Date(round.tee_time).toLocaleString()}.
        </Typography>
      </View>
    );
  }

  // declined
  return (
    <Typography variant="body" color="ink-soft">
      host declined this one. try another round.
    </Typography>
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
    "your requests get cancelled. this can't be undone.",
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

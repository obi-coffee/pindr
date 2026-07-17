import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../../../components/motion/Toast';
import { Button, Typography, useTheme } from '../../../../components/ui';
import { useAuth } from '../../../../lib/auth/AuthProvider';
import { fetchProfileById, type Candidate } from '../../../../lib/discover/queries';
import { useMatch } from '../../../../lib/match/MatchProvider';
import { createMatchFromQr, type QrMatchError } from '../../../../lib/match/qr';

const ERROR_COPY: Record<QrMatchError, string> = {
  self_scan: "that's your own code 🙃",
  blocked: "couldn't connect to that account.",
  unavailable: "that profile is no longer available.",
  unknown: "something went wrong. mind trying again?",
};

export default function QrConfirmScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const { showMatch } = useMatch();

  const [profile, setProfile] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProfileById(userId);
      setProfile(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onConfirm = async () => {
    if (!user || !profile || confirming) return;
    setConfirming(true);
    const result = await createMatchFromQr({
      scannerId: user.id,
      scannedUserId: profile.user_id,
    });
    if ('error' in result) {
      setConfirming(false);
      showToast(ERROR_COPY[result.error], { variant: 'error' });
      return;
    }
    // Fire the match moment overlay (shared via MatchProvider) and
    // navigate to the new chat thread. The overlay sits above the
    // chat screen and the user dismisses it into the conversation.
    showMatch(profile, result.matchId);
    router.replace(`/chat/${result.matchId}` as never);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography variant="caption" color="ink-soft">
            cancel
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          confirm match
        </Typography>
        <View style={{ minWidth: 48 }} />
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
            gap: 12,
          }}
        >
          <Typography variant="body" color="burgundy" style={{ textAlign: 'center' }}>
            couldn't load that profile.
          </Typography>
          <Button variant="ghost" size="md" onPress={load}>
            try again
          </Button>
        </View>
      ) : !profile ? (
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
            color="ink-soft"
            style={{ textAlign: 'center' }}
          >
            that profile is no longer available.
          </Typography>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingBottom: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
          }}
        >
          <View
            style={{
              width: 180,
              height: 180,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: colors['paper-raised'],
              borderWidth: 2,
              borderColor: colors.mustard,
            }}
          >
            {profile.photo_urls[0] ? (
              <Image
                source={{ uri: profile.photo_urls[0] }}
                style={{ flex: 1 }}
                resizeMode="cover"
              />
            ) : null}
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Typography variant="h1" style={{ textAlign: 'center' }}>
              match with {profile.display_name ?? 'them'}?
            </Typography>
            <Typography
              variant="body"
              color="ink-soft"
              style={{ textAlign: 'center' }}
            >
              you'll both be able to chat right away. no swipes needed.
            </Typography>
          </View>

          <View style={{ width: '100%', gap: 10 }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={confirming}
              onPress={onConfirm}
            >
              Lock in
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              disabled={confirming}
              onPress={() => router.back()}
            >
              Cancel
            </Button>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  fetchBlockedProfiles,
  unblockUser,
  type BlockedProfile,
} from '../../lib/safety/queries';

export default function Blocks() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [blocks, setBlocks] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBlockedProfiles(user.id);
      setBlocks(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmUnblock = (target: BlockedProfile) => {
    Alert.alert(
      `unblock ${target.display_name ?? 'this user'}?`,
      "they'll be able to see you in discover again.",
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'unblock',
          onPress: async () => {
            if (!user) return;
            try {
              await unblockUser(user.id, target.blocked_id);
              await load();
            } catch (err) {
              Alert.alert('could not unblock', (err as Error).message);
            }
          },
        },
      ],
    );
  };

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
          blocked
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
          data={blocks}
          keyExtractor={(b) => b.blocked_id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 80,
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <Typography
                variant="display-lg"
                style={{ textAlign: 'center' }}
              >
                nobody{'\n'}blocked.
              </Typography>
              <View style={{ height: 12 }} />
              <Typography
                variant="body"
                color="ink-soft"
                style={{ textAlign: 'center' }}
              >
                if anyone gets out of pocket, you can block from their card
                or chat.
              </Typography>
            </View>
          )}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: colors['paper-raised'],
                  marginRight: 12,
                }}
              >
                {item.photo_url ? (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
              <Typography
                variant="body-lg"
                style={{ flex: 1, fontWeight: '500' }}
              >
                {item.display_name ?? 'Blocked user'}
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => confirmUnblock(item)}
              >
                Unblock
              </Button>
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.stroke,
                marginLeft: 80,
                marginRight: 20,
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  fetchBlockedProfiles,
  unblockUser,
  type BlockedProfile,
} from '../../lib/safety/queries';

export default function Blocks() {
  const { user } = useAuth();
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
      `Unblock ${target.display_name ?? 'this user'}?`,
      "They'll be able to see you in Discover again.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            if (!user) return;
            try {
              await unblockUser(user.id, target.blocked_id);
              await load();
            } catch (err) {
              Alert.alert('Could not unblock', (err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center border-b border-slate-100 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-2 h-9 w-9 items-center justify-center active:opacity-70"
        >
          <Text className="text-2xl text-slate-700">‹</Text>
        </Pressable>
        <Text className="text-base font-semibold text-slate-900">
          Blocked users
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(b) => b.blocked_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={() => (
            <View className="mt-24 items-center px-8">
              <Text className="text-4xl">🌱</Text>
              <Text className="mt-4 text-center text-base text-slate-600">
                You haven't blocked anyone.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="flex-row items-center rounded-xl border border-slate-100 bg-white p-3">
              <View className="mr-3 h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                {item.photo_url ? (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text>⛳</Text>
                  </View>
                )}
              </View>
              <Text className="flex-1 text-base font-medium text-slate-900">
                {item.display_name ?? 'Blocked user'}
              </Text>
              <Pressable
                onPress={() => confirmUnblock(item)}
                className="rounded-lg border border-slate-300 px-3 py-1 active:opacity-70"
              >
                <Text className="text-sm font-medium text-slate-700">
                  Unblock
                </Text>
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}
    </SafeAreaView>
  );
}

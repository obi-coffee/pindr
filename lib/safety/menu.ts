import { router } from 'expo-router';
import { Alert } from 'react-native';
import { blockUser } from './queries';

type OpenUserMenuOptions = {
  currentUserId: string;
  targetUserId: string;
  targetName?: string | null;
  onBlocked?: () => void;
};

export function openUserMenu({
  currentUserId,
  targetUserId,
  targetName,
  onBlocked,
}: OpenUserMenuOptions): void {
  Alert.alert('Actions', undefined, [
    {
      text: 'Report',
      onPress: () => router.push(`/report/${targetUserId}` as never),
    },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () => confirmBlock(currentUserId, targetUserId, targetName, onBlocked),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

function confirmBlock(
  currentUserId: string,
  targetUserId: string,
  targetName: string | null | undefined,
  onBlocked?: () => void,
) {
  Alert.alert(
    `Block ${targetName ?? 'this user'}?`,
    "You'll both disappear from each other's Discover and Matches.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(currentUserId, targetUserId);
            onBlocked?.();
          } catch (err) {
            Alert.alert('Could not block', (err as Error).message);
          }
        },
      },
    ],
  );
}

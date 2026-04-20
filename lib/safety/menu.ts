import { router } from 'expo-router';
import { Alert } from 'react-native';
import { blockUser } from './queries';

type OpenUserMenuOptions = {
  currentUserId: string;
  targetUserId: string;
  targetName?: string | null;
  matchId?: string | null;
  onBlocked?: () => void;
};

export function openUserMenu({
  currentUserId,
  targetUserId,
  targetName,
  matchId,
  onBlocked,
}: OpenUserMenuOptions): void {
  const buttons: Parameters<typeof Alert.alert>[2] = [];
  if (matchId) {
    buttons.push({
      text: 'Share my plans',
      onPress: () => router.push(`/share-plan/${matchId}` as never),
    });
  }
  buttons.push({
    text: 'Report',
    onPress: () => router.push(`/report/${targetUserId}` as never),
  });
  buttons.push({
    text: 'Block',
    style: 'destructive',
    onPress: () =>
      confirmBlock(currentUserId, targetUserId, targetName, onBlocked),
  });
  buttons.push({ text: 'Cancel', style: 'cancel' });
  Alert.alert('Actions', undefined, buttons);
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

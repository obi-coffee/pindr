import { router } from 'expo-router';
import { Alert } from 'react-native';
import { blockUser } from './queries';

export type MenuToast = (
  message: string,
  opts?: { variant?: 'info' | 'error' },
) => void;

type OpenUserMenuOptions = {
  currentUserId: string;
  targetUserId: string;
  targetName?: string | null;
  matchId?: string | null;
  toast: MenuToast;
  // Fires optimistically the moment the user confirms a block — the
  // caller uses it to remove the card/thread from the UI before the
  // network round-trip. If the block fails, onBlockFailed is invoked
  // so the caller can restore whatever it removed.
  onBlocked?: () => void;
  onBlockFailed?: () => void;
};

export function openUserMenu({
  currentUserId,
  targetUserId,
  targetName,
  matchId,
  toast,
  onBlocked,
  onBlockFailed,
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
      confirmBlock({
        currentUserId,
        targetUserId,
        targetName,
        toast,
        onBlocked,
        onBlockFailed,
      }),
  });
  buttons.push({ text: 'Cancel', style: 'cancel' });
  Alert.alert('Actions', undefined, buttons);
}

function confirmBlock({
  currentUserId,
  targetUserId,
  targetName,
  toast,
  onBlocked,
  onBlockFailed,
}: {
  currentUserId: string;
  targetUserId: string;
  targetName?: string | null;
  toast: MenuToast;
  onBlocked?: () => void;
  onBlockFailed?: () => void;
}) {
  Alert.alert(
    `Block ${targetName ?? 'this user'}?`,
    "You'll both disappear from each other's Discover and Matches.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          // Optimistic: remove from deck and confirm to the user
          // immediately, then hit the server. Rollback + error toast
          // on failure.
          onBlocked?.();
          toast("thanks, we've got it");
          blockUser(currentUserId, targetUserId).catch(() => {
            onBlockFailed?.();
            toast("couldn't save that — mind trying again?", {
              variant: 'error',
            });
          });
        },
      },
    ],
  );
}

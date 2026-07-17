import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerForPushNotifications } from './client';

export type PushPromptTrigger = 'first_match' | 'first_round_post';

const ASKED_KEY_PREFIX = 'pindr.push.asked.';

function askedKey(userId: string) {
  return `${ASKED_KEY_PREFIX}${userId}`;
}

// Guarded entrypoint called from the match and round-post flows. Ensures the
// OS permission prompt appears at most once per user per device — after that,
// the OS owns the state and toggling happens in system settings.
export async function maybePromptForPush(
  userId: string,
  trigger: PushPromptTrigger,
): Promise<void> {
  try {
    const already = await AsyncStorage.getItem(askedKey(userId));
    if (already) return;

    // Mark "asked" before firing the request so a duplicate trigger
    // (e.g. two matches in quick succession) doesn't stack prompts.
    await AsyncStorage.setItem(askedKey(userId), trigger);

    await registerForPushNotifications(userId);
  } catch {
    // Fire-and-forget — never surface errors to the UI.
  }
}

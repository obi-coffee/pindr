import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '../supabase';

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'not_physical_device' | 'permission_denied' | 'no_project_id' | 'error'; error?: unknown };

function resolveProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#ffffff',
  });
}

export async function registerForPushNotifications(
  userId: string,
): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'not_physical_device' };
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return { ok: false, reason: 'no_project_id' };
  }

  try {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceName = Device.deviceName ?? null;

    const { error: tokenError } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          device_name: deviceName,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' },
      );
    if (tokenError) throw tokenError;

    // Overwrite the Step-1 default timezone with the device's real one.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      await supabase
        .from('notification_preferences')
        .update({ timezone })
        .eq('user_id', userId);
    }

    return { ok: true, token };
  } catch (error) {
    return { ok: false, reason: 'error', error };
  }
}

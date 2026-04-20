import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function Done() {
  const { user, profile, refetchProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      await refetchProfile();
      router.replace('/');
    } catch (err) {
      Alert.alert('Could not finish', (err as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-3 text-5xl">⛳</Text>
        <Text className="mb-2 text-center text-3xl font-bold text-slate-900">
          You're on the tee, {profile?.display_name ?? 'player'}.
        </Text>
        <Text className="mb-10 text-center text-base text-slate-500">
          Your profile is live. Start finding rounds you'll actually look
          forward to.
        </Text>

        <Pressable
          onPress={finish}
          disabled={busy}
          className={`w-full items-center rounded-lg py-3 ${
            busy ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {busy ? 'Almost there…' : 'Enter Pindr'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

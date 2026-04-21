import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography, colors } from '../../components/ui';
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
      Alert.alert('could not finish', (err as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 14 }}
        >
          you're in.
        </Typography>
        <Typography variant="display-lg" style={{ marginBottom: 16 }}>
          you're on the tee
          {profile?.display_name ? `, ${profile.display_name.toLowerCase()}` : ''}.
        </Typography>
        <Typography variant="body-lg" color="ink-soft">
          four hours, your people, the game. pindr's got you.
        </Typography>
      </View>

      <View style={{ paddingHorizontal: 28, paddingBottom: 24 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          onPress={finish}
        >
          Enter Pindr
        </Button>
      </View>
    </SafeAreaView>
  );
}

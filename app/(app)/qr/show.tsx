import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useToast } from '../../../components/motion/Toast';
import { Button, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { encodeMyQr } from '../../../lib/match/qr';

export default function QrShowScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const [copying, setCopying] = useState(false);

  if (!user) return null;

  const payload = encodeMyQr(user.id);

  const onCopy = async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(payload);
      showToast('link copied to your clipboard');
    } finally {
      setCopying(false);
    }
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
            back
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          your code
        </Typography>
        <View style={{ minWidth: 48 }} />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingBottom: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Typography variant="h1" style={{ textAlign: 'center' }}>
            scan to lock in.
          </Typography>
          <Typography
            variant="body"
            color="ink-soft"
            style={{ textAlign: 'center' }}
          >
            {profile?.display_name
              ? `someone scans this and you two are matched, no swipes needed.`
              : 'someone scans this and you two are matched, no swipes needed.'}
          </Typography>
        </View>

        <View
          style={{
            padding: 24,
            backgroundColor: colors['paper-high'],
            borderRadius: 24,
            shadowColor: colors.ink,
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <QRCode
            value={payload}
            size={240}
            color={colors.ink}
            backgroundColor={colors['paper-high']}
          />
        </View>

        <View style={{ width: '100%', gap: 10 }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/qr/scan' as never)}
          >
            Scan a code
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            loading={copying}
            onPress={onCopy}
          >
            Copy link
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

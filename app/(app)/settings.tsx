import { Link, router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';

const APPEARANCE_LABEL = {
  system: 'system',
  light: 'light',
  dark: 'dark',
} as const;

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { signOut } = useAuth();

  const nextMode =
    mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';

  const handleSignOut = async () => {
    await signOut();
    router.back();
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
          paddingTop: 28,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography variant="caption" color="ink-soft">
            cancel
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          settings
        </Typography>
        <View style={{ minWidth: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Row label="notifications" trailing="coming soon" disabled />
        <Row
          label="appearance"
          trailing={APPEARANCE_LABEL[mode]}
          onPress={() => setMode(nextMode)}
        />
        <Row label="community guidelines" href="/guidelines" />
        <Row label="blocked users" href="/blocks" />
        <Row label="sign out" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  href,
  onPress,
  trailing,
  disabled,
}: {
  label: string;
  href?: string;
  onPress?: () => void;
  trailing?: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: colors.stroke,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Typography variant="body">{label}</Typography>
      <Typography variant="body" color="ink-subtle">
        {trailing ? `${trailing} ${disabled ? '' : '›'}` : '›'}
      </Typography>
    </View>
  );

  if (disabled) return content;
  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable>{content}</Pressable>
      </Link>
    );
  }
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

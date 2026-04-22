import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useHaptics } from '../../lib/haptics';

const APPEARANCE_LABEL = {
  system: 'system',
  light: 'light',
  dark: 'dark',
} as const;

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { signOut } = useAuth();
  const haptics = useHaptics();
  const reducedMotion = useReducedMotion();

  const nextMode =
    mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';

  const handleSignOut = async () => {
    await signOut();
    router.back();
  };

  const handleHapticsToggle = (next: boolean) => {
    haptics.setEnabled(next);
    // Fire a confirm pulse when turning on, so the user feels what they
    // just enabled. No buzz on the off-transition.
    if (next) haptics.toggle();
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
        <SectionLabel>motion</SectionLabel>
        <SwitchRow
          label="haptics"
          value={haptics.enabled}
          onChange={handleHapticsToggle}
        />
        <Row label="reduce motion" trailing={reducedMotion ? 'on' : 'off'} disabled />

        <SectionLabel>preferences</SectionLabel>
        <Row label="notifications" href="/notifications" />
        <Row
          label="appearance"
          trailing={APPEARANCE_LABEL[mode]}
          onPress={() => setMode(nextMode)}
        />

        <SectionLabel>account</SectionLabel>
        <Row label="community guidelines" href="/guidelines" />
        <Row label="blocked users" href="/blocks" />
        <Row label="sign out" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      <Typography variant="caption" color="ink-subtle">
        {children}
      </Typography>
    </View>
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

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <Typography variant="body">{label}</Typography>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.stroke, true: colors.moss }}
        thumbColor={colors['paper-high']}
        ios_backgroundColor={colors.stroke}
      />
    </View>
  );
}

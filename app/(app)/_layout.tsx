import { Redirect, Stack } from 'expo-router';
import { useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function AppLayout() {
  const { session, profile, profileLoading } = useAuth();
  const { colors } = useTheme();
  if (!session) return <Redirect href="/sign-in" />;
  if (!profile && profileLoading) return null;
  if (!profile?.onboarded_at) return <Redirect href="/basics" />;

  const sheetOptions = {
    presentation: 'formSheet' as const,
    sheetAllowedDetents: 'fitToContents' as const,
    sheetCornerRadius: 20,
    contentStyle: { backgroundColor: colors.paper },
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="filters" options={sheetOptions} />
      <Stack.Screen name="settings" options={sheetOptions} />
      <Stack.Screen name="travel" options={sheetOptions} />
      <Stack.Screen name="report/[userId]" options={sheetOptions} />
      <Stack.Screen name="share-plan/[matchId]" options={sheetOptions} />
    </Stack>
  );
}

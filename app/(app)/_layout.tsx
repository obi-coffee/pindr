import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function AppLayout() {
  const { session, profile, profileLoading } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;
  if (!profile && profileLoading) return null;
  if (!profile?.onboarded_at) return <Redirect href="/basics" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
      <Stack.Screen name="travel" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function OnboardingLayout() {
  const { session, profile, profileLoading } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;
  if (profileLoading) return null;
  if (profile?.onboarded_at) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

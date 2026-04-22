import '../global.css';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/motion/Toast';
import { ThemeProvider, useTheme } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth/AuthProvider';
import { HapticsProvider } from '../lib/haptics';
import { usePushDeepLinking } from '../lib/push/deep-linking';

// Keep the native splash up past its default "first-paint" dismiss so
// the hold time below actually has an effect.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Minimum splash duration: we hide the splash max(SPLASH_MIN_MS, time
// fonts/app become ready). A brief hold lets users actually see the
// brand moment rather than flashing into an empty paper screen.
const SPLASH_MIN_MS = 2000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function RootSlot() {
  const { loading } = useAuth();
  const { colors, scheme } = useTheme();
  usePushDeepLinking();
  if (loading)
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!fontsLoaded) return;
    const elapsed = Date.now() - mountedAt;
    const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, remaining);
    return () => clearTimeout(timer);
  }, [fontsLoaded, mountedAt]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <HapticsProvider>
            <ToastProvider>
              <AuthProvider>
                <RootSlot />
              </AuthProvider>
            </ToastProvider>
          </HapticsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

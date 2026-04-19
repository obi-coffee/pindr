import '../global.css';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../lib/auth/AuthProvider';

function RootSlot() {
  const { loading } = useAuth();
  if (loading) return <View className="flex-1 bg-white" />;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootSlot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

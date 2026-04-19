import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold text-emerald-600">Pindr</Text>
        <Text className="mt-2 text-base text-slate-500">You're signed in</Text>
        <Text className="mt-1 text-sm text-slate-400">{user?.email}</Text>

        <Pressable
          onPress={signOut}
          className="mt-10 rounded-lg border border-slate-300 px-6 py-3 active:opacity-70"
        >
          <Text className="text-base font-medium text-slate-700">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

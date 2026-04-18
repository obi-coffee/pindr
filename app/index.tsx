import { SafeAreaView, Text, View } from 'react-native';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-5xl font-bold text-emerald-600">Pindr</Text>
        <Text className="mt-3 text-base text-slate-500">
          Phase 1 · app shell
        </Text>
      </View>
    </SafeAreaView>
  );
}

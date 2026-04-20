import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommunityGuidelinesBody } from '../(app)/guidelines';

export default function AuthGuidelines() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center border-b border-slate-100 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-2 h-9 w-9 items-center justify-center active:opacity-70"
        >
          <Text className="text-2xl text-slate-700">‹</Text>
        </Pressable>
        <Text className="text-base font-semibold text-slate-900">
          Community guidelines
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <CommunityGuidelinesBody />
      </ScrollView>
    </SafeAreaView>
  );
}

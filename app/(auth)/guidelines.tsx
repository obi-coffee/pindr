import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, colors } from '../../components/ui';
import { CommunityGuidelinesBody } from '../(app)/guidelines';

export default function AuthGuidelines() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.stroke,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Typography variant="h2" color="ink">
            ‹
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          guidelines
        </Typography>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <CommunityGuidelinesBody />
      </ScrollView>
    </SafeAreaView>
  );
}

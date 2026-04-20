import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: 'Be respectful, always',
    points: [
      'Everyone on Pindr is here to play. Treat every match with the same respect you would a clubhouse regular.',
      'Hate speech, harassment, and intimidation are not allowed and will result in a ban.',
      'Unwelcome sexual content, requests, or imagery are banned without exception.',
    ],
  },
  {
    title: 'Safety first',
    points: [
      'Meet in public spaces for the first round. Courses are public — start there.',
      'Tell a friend where you are going. Use "Share my plans" from any match to send them the details.',
      'Trust your gut. If something feels off, block and report — every report is reviewed.',
    ],
  },
  {
    title: 'Be honest about your golf',
    points: [
      'Your handicap, experience, and play style help others decide if you fit their round. Keep it accurate.',
      'Show up when you say you will. Ghosting is grounds for a report.',
      'Pace of play matters. If you say "ready golf", mean it.',
    ],
  },
  {
    title: 'No catfishing',
    points: [
      'Use recent photos of yourself. Old photos or photos of someone else break trust and break the rules.',
      'Profiles representing a business, group, or someone who is not signed in will be removed.',
    ],
  },
  {
    title: 'Keep it legal',
    points: [
      'You must be 18 or older.',
      'Do not buy, sell, or advertise on the platform.',
      'Do not share illegal content, including betting services that are not legal in your state.',
    ],
  },
];

export function CommunityGuidelinesBody() {
  return (
    <View>
      <Text className="mb-2 text-3xl font-bold text-slate-900">
        Community guidelines
      </Text>
      <Text className="mb-6 text-base text-slate-500">
        Pindr is a place for golfers to find playing partners. Breaking these
        rules can get you suspended or banned.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.title} className="mb-6">
          <Text className="mb-2 text-lg font-semibold text-slate-900">
            {section.title}
          </Text>
          {section.points.map((point, i) => (
            <View key={i} className="mb-1.5 flex-row">
              <Text className="mr-2 text-slate-500">•</Text>
              <Text className="flex-1 text-base text-slate-700">{point}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text className="mt-2 text-xs text-slate-400">
        We may update these rules as the community grows. You're responsible
        for following the current version.
      </Text>
    </View>
  );
}

export default function GuidelinesScreen() {
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

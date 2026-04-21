import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, useTheme } from '../../components/ui';

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
      <Typography variant="h1" style={{ marginBottom: 8 }}>
        community guidelines.
      </Typography>
      <Typography
        variant="body-lg"
        color="ink-soft"
        style={{ marginBottom: 28 }}
      >
        Pindr is a place for golfers to find playing partners. Breaking these
        rules can get you suspended or banned.
      </Typography>

      {SECTIONS.map((section) => (
        <View key={section.title} style={{ marginBottom: 24 }}>
          <Typography variant="h3" style={{ marginBottom: 8 }}>
            {section.title}
          </Typography>
          {section.points.map((point, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', marginBottom: 6 }}
            >
              <Typography
                variant="body"
                color="ink-subtle"
                style={{ marginRight: 8 }}
              >
                •
              </Typography>
              <Typography variant="body" color="ink" style={{ flex: 1 }}>
                {point}
              </Typography>
            </View>
          ))}
        </View>
      ))}

      <Typography
        variant="body-sm"
        color="ink-subtle"
        style={{ marginTop: 12 }}
      >
        We may update these rules as the community grows. You're responsible
        for following the current version.
      </Typography>
    </View>
  );
}

export default function GuidelinesScreen() {
  const { colors } = useTheme();
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

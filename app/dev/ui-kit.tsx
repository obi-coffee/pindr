import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Tag,
  Typography,
  useTheme,
  type TypographyVariant,
} from '../../components/ui';

const TYPE_SAMPLES: { variant: TypographyVariant; sample: string }[] = [
  { variant: 'display-xl', sample: 'Find your foursome.' },
  { variant: 'display-lg', sample: 'You found your people.' },
  { variant: 'h1', sample: 'maya locked in too' },
  { variant: 'h2', sample: 'how you play' },
  { variant: 'h3', sample: "why i'm out here" },
  {
    variant: 'body-lg',
    sample:
      "twilight tee time this week? i'm flexible after 4. grab the group chat and tell me the course.",
  },
  {
    variant: 'body',
    sample:
      "no one nearby yet. widen your distance, or flip on travel mode if you're away from home.",
  },
  {
    variant: 'body-sm',
    sample: 'active today · email verified · phone verified',
  },
  { variant: 'caption', sample: 'Handicap · Playing · Style' },
  { variant: 'card-name', sample: 'Maya, 28' },
  { variant: 'card-distance', sample: '12 mi' },
  { variant: 'card-meta', sample: 'Home · Presidio GC, San Francisco' },
  { variant: 'card-stat-label', sample: 'Handicap' },
  { variant: 'card-stat-value', sample: '14.2' },
  { variant: 'card-prompt-label', sample: "Why i'm out here" },
  {
    variant: 'card-prompt-body',
    sample:
      'three years in and still making friends before i break 90. priorities.',
  },
];

export default function UIKit() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 64 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 8 }}>
          <Typography variant="caption" color="ink-soft">
            ← Back
          </Typography>
        </Pressable>

        <View style={{ height: 16 }} />
        <Typography variant="h1">UI kit</Typography>
        <View style={{ height: 4 }} />
        <Typography variant="body-sm" color="ink-soft">
          Dev-only. Remove before ship.
        </Typography>

        <Divider />
        <SectionHeading>Typography</SectionHeading>
        {TYPE_SAMPLES.map(({ variant, sample }) => (
          <View key={variant} style={{ marginBottom: 18 }}>
            <Typography variant="caption" color="ink-subtle">
              {variant}
            </Typography>
            <View style={{ height: 4 }} />
            <Typography variant={variant}>{sample}</Typography>
          </View>
        ))}

        <Divider />
        <SectionHeading>Buttons</SectionHeading>
        <View style={{ gap: 12 }}>
          <Button variant="primary" size="lg" fullWidth>
            Lock in
          </Button>
          <Button variant="ghost" size="lg" fullWidth>
            Pass
          </Button>
          <Button variant="destructive" size="lg" fullWidth>
            Block
          </Button>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="ghost" size="lg" style={{ flex: 1 }}>
              Pass
            </Button>
            <Button variant="primary" size="lg" style={{ flex: 1 }}>
              Lock in
            </Button>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Button variant="primary" size="sm">
              Save
            </Button>
            <Button variant="primary" size="md">
              Send
            </Button>
            <Button variant="primary" size="lg">
              Lock in
            </Button>
          </View>
          <Button variant="primary" size="lg" loading fullWidth>
            Loading
          </Button>
        </View>

        <Divider />
        <SectionHeading>Tags</SectionHeading>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Tag>Walks</Tag>
          <Tag>9 or 18</Tag>
          <Tag>Post-round hang</Tag>
          <Tag variant="solid">Open to tips</Tag>
          <Tag size="sm">Small</Tag>
        </View>

        <Divider />
        <SectionHeading>Card</SectionHeading>
        <Card
          photo={{
            uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&q=80&auto=format&fit=crop',
          }}
          stateBadge={<Tag>Near you</Tag>}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 4,
            }}
          >
            <Typography variant="card-name">Maya, 28</Typography>
            <Typography variant="card-distance" color="ink-soft">
              12 mi
            </Typography>
          </View>
          <Typography variant="card-meta" color="ink-soft">
            Home · Presidio GC, San Francisco
          </Typography>
          <View style={{ height: 16 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="ghost" size="lg" style={{ flex: 1 }}>
              Pass
            </Button>
            <Button variant="primary" size="lg" style={{ flex: 1 }}>
              Lock in
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Typography variant="caption" color="ink-soft">
        {children}
      </Typography>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.stroke,
        marginVertical: 28,
      }}
    />
  );
}

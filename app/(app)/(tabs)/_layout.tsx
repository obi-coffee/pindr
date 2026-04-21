import { Tabs } from 'expo-router';
import { colors, fontFamilyFor } from '../../../components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors['ink-subtle'],
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.stroke,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilyFor('700'),
          fontSize: 11,
          letterSpacing: 1.54,
          textTransform: 'uppercase',
        },
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'matches' }} />
      <Tabs.Screen name="profile" options={{ title: 'profile' }} />
    </Tabs>
  );
}

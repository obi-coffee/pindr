import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilyFor } from '../../../components/ui';

function PillLabel({
  label,
  focused,
}: {
  label: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: focused ? 'rgba(251,249,243,0.9)' : 'transparent',
        alignSelf: 'center',
        shadowColor: colors.ink,
        shadowOpacity: focused ? 0.06 : 0,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: focused ? colors.ink : colors['ink-soft'],
          fontFamily: fontFamilyFor(focused ? '600' : '500'),
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 88,
          paddingTop: 0,
          paddingBottom: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 20,
              left: 16,
              right: 16,
              height: 58,
              borderRadius: 28,
              overflow: 'hidden',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(251,249,243,0.15)',
              shadowColor: colors.ink,
              shadowOpacity: 0.12,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <BlurView
              intensity={60}
              tint="systemUltraThinMaterialLight"
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 10,
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'discover',
          tabBarIcon: ({ focused }) => (
            <PillLabel label="Discover" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'matches',
          tabBarIcon: ({ focused }) => (
            <PillLabel label="Matches" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ focused }) => (
            <PillLabel label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

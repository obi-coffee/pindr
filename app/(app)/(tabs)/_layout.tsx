import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  TabIcon,
  useTheme,
  type Palette,
  type TabIconName,
} from '../../../components/ui';
import { duration } from '../../../lib/motion';

// Focus-state transition lives here instead of the plan's 2px underline:
// the floating pill tab bar from Phase 5b already is the active
// indicator. All we change is how it *arrives* — background opacity +
// icon color cross-fade over duration.fast when focus changes.
function PillIcon({
  name,
  focused,
  colors,
  isDark,
}: {
  name: TabIconName;
  focused: boolean;
  colors: Palette;
  isDark: boolean;
}) {
  const activeBg = isDark
    ? 'rgba(245,239,226,0.14)'
    : 'rgba(251,249,243,0.9)';
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: duration.fast });
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 22,
            backgroundColor: activeBg,
            shadowColor: colors.ink,
            shadowOpacity: isDark ? 0 : 0.06,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
          },
          pillStyle,
        ]}
      />
      <Animated.View style={[{ position: 'absolute' }, inactiveIconStyle]}>
        <TabIcon name={name} color={colors['ink-soft']} size={34} />
      </Animated.View>
      <Animated.View style={iconStyle}>
        <TabIcon name={name} color={colors.ink} size={34} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  const isDark = scheme === 'dark';
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
          paddingHorizontal: 16,
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
              borderColor: isDark
                ? 'rgba(245,239,226,0.12)'
                : 'rgba(255,255,255,0.5)',
              backgroundColor: isDark
                ? 'rgba(20,26,21,0.35)'
                : 'rgba(251,249,243,0.15)',
              shadowColor: colors.ink,
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <BlurView
              intensity={60}
              tint={
                isDark
                  ? 'systemUltraThinMaterialDark'
                  : 'systemUltraThinMaterialLight'
              }
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
            <PillIcon
              name="discover"
              focused={focused}
              colors={colors}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'matches',
          tabBarIcon: ({ focused }) => (
            <PillIcon
              name="matches"
              focused={focused}
              colors={colors}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rounds"
        options={{
          title: 'rounds',
          tabBarIcon: ({ focused }) => (
            <PillIcon
              name="rounds"
              focused={focused}
              colors={colors}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ focused }) => (
            <PillIcon
              name="profile"
              focused={focused}
              colors={colors}
              isDark={isDark}
            />
          ),
        }}
      />
    </Tabs>
  );
}

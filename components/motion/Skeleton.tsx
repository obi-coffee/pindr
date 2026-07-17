// Skeleton primitive — paper-colored rounded rectangle with a lighter
// band sweeping left-to-right on a duration.shimmer cycle. Plan §4.4:
// replace with real content via a 120ms fade when data arrives (callers
// handle the fade — this component just animates itself).
//
// Reduced-motion: no sweep. Static block.

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { duration } from '../../lib/motion';
import { useTheme } from '../ui';

export type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

export function Skeleton({ style, borderRadius = 8 }: SkeletonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (reduced || layoutWidth === 0) {
      cancelAnimation(translateX);
      return;
    }
    translateX.value = -layoutWidth;
    translateX.value = withRepeat(
      withTiming(layoutWidth, {
        duration: duration.shimmer,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, [layoutWidth, reduced, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - layoutWidth) > 1) setLayoutWidth(w);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          backgroundColor: colors.paper,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {layoutWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: layoutWidth,
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              colors['paper-high'],
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

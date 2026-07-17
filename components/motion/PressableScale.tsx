// PressableScale — press-in animation for primary-feeling buttons.
// Plan §4.3: scale 1 → 0.97, opacity 1 → 0.88, duration.instant; release
// springs back with spring.snap. Light-impact haptic fires on press-in.
//
// The Reanimated useReducedMotion hook short-circuits to opacity-only
// behavior (no scale transform) when the user has Reduce Motion on.

import { forwardRef, useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { duration, spring } from '../../lib/motion';
import { useHaptics } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  hapticOnPress?: boolean;
};

export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale(
    { style, hapticOnPress = true, onPressIn, onPressOut, disabled, ...rest },
    ref,
  ) {
    const reduced = useReducedMotion();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const { primaryTap } = useHaptics();

    const handlePressIn = useCallback(
      (e: GestureResponderEvent) => {
        if (reduced) {
          opacity.value = withTiming(0.88, { duration: duration.instant });
        } else {
          scale.value = withTiming(0.97, { duration: duration.instant });
          opacity.value = withTiming(0.88, { duration: duration.instant });
        }
        if (hapticOnPress) primaryTap();
        onPressIn?.(e);
      },
      [reduced, scale, opacity, hapticOnPress, primaryTap, onPressIn],
    );

    const handlePressOut = useCallback(
      (e: GestureResponderEvent) => {
        if (reduced) {
          opacity.value = withTiming(1, { duration: duration.fast });
        } else {
          scale.value = withSpring(1, spring.snap);
          opacity.value = withSpring(1, spring.snap);
        }
        onPressOut?.(e);
      },
      [reduced, scale, opacity, onPressOut],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        {...rest}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style, animatedStyle]}
      />
    );
  },
);

// PressableFade — press-in animation for ghost / secondary buttons.
// Plan §4.3: opacity 1 → 0.6, duration.instant. No scale. No haptic.
//
// Also the behavior under Reduce Motion — opacity changes are already
// accessibility-friendly, so nothing special is needed.

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
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration } from '../../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableFadeProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export const PressableFade = forwardRef<View, PressableFadeProps>(
  function PressableFade({ style, onPressIn, onPressOut, disabled, ...rest }, ref) {
    const opacity = useSharedValue(1);

    const handlePressIn = useCallback(
      (e: GestureResponderEvent) => {
        opacity.value = withTiming(0.6, { duration: duration.instant });
        onPressIn?.(e);
      },
      [opacity, onPressIn],
    );

    const handlePressOut = useCallback(
      (e: GestureResponderEvent) => {
        opacity.value = withTiming(1, { duration: duration.fast });
        onPressOut?.(e);
      },
      [opacity, onPressOut],
    );

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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

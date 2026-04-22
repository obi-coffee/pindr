// FadeIn — wraps its children in an opacity transition from 0 to 1 on
// mount. Used to soften the skeleton → real-content swap (plan §4.4:
// "replace with real content via a 120ms fade when data arrives").
//
// The fade happens on first render each time this component mounts, so
// parents that toggle between a skeleton and real content (e.g.
// `loading ? <Skeleton/> : <FadeIn>{content}</FadeIn>`) get the fade
// every time the real content remounts.

import { ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration as motionDuration } from '../../lib/motion';

export type FadeInProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  durationMs?: number;
};

export function FadeIn({
  children,
  style,
  durationMs = motionDuration.fast,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: durationMs });
  }, [opacity, durationMs, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

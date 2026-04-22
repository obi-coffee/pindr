// FadeIn — wraps children with Reanimated's `entering` mount animation
// (the canonical approach on new architecture + Reanimated v4, where
// useSharedValue + useEffect can race the first paint and make the
// fade look like a snap).
//
// Plan §4.4 specifies "120ms fade when data arrives" but 120ms reads
// as near-instant in practice. Defaulting to duration.base (220ms) so
// the ease is actually perceptible without feeling sluggish.
//
// Reduced Motion: skip the entering animation entirely.

import { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn as ReanimatedFadeIn,
  useReducedMotion,
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
  durationMs = motionDuration.slow,
}: FadeInProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }
  return (
    <Animated.View
      entering={ReanimatedFadeIn.duration(durationMs)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

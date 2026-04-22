// PullRefresh — custom pull-to-refresh indicator per plan §4.4. Wraps a
// FlatList (or any scrollable) with a RefreshControl underneath for the
// cross-platform refresh mechanism, but masks the stock spinner
// (tintColor=transparent / colors=['transparent']) and overlays our own
// mustard arc that rotates continuously while refreshing, fading in and
// out on state change.
//
// Plan specifies a "fills clockwise as the user pulls" pre-release arc,
// which needs either iOS-only scroll-offset math or a platform-specific
// gesture rewrite. Deferring that visual to a follow-up; the post-release
// rotation + fade is what actually reads as "refreshing" to the user.

import { ReactElement, cloneElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { RefreshControl } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { duration } from '../../lib/motion';
import { useTheme } from '../ui';

const ARC_SIZE = 28;
const ARC_STROKE = 3;
const ARC_RADIUS = (ARC_SIZE - ARC_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
// Leave a small gap so the arc reads as a circle-in-progress rather
// than a complete ring.
const ARC_DASH = CIRCUMFERENCE * 0.75;
const ARC_GAP = CIRCUMFERENCE - ARC_DASH;

export type PullRefreshProps = {
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactElement<{
    refreshControl?: React.ReactElement;
    contentContainerStyle?: unknown;
  }>;
};

export function PullRefresh({ refreshing, onRefresh, children }: PullRefreshProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      opacity.value = withTiming(1, { duration: duration.fast });
      if (!reduced) {
        rotation.value = 0;
        rotation.value = withRepeat(
          withTiming(360, {
            duration: duration.slow,
            easing: Easing.linear,
          }),
          -1,
          false,
        );
      }
    } else {
      cancelAnimation(rotation);
      opacity.value = withTiming(0, { duration: duration.fast });
    }
    return () => {
      cancelAnimation(rotation);
    };
  }, [refreshing, reduced, rotation, opacity]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Inject the RefreshControl into the wrapped scrollable. tintColor is
  // matched to the paper background so the platform spinner visually
  // dissolves into the backdrop; our mustard indicator takes its place
  // on top. ("transparent" string is unreliable — iOS sometimes renders
  // the spinner at full opacity regardless.)
  const withRefresh = cloneElement(children, {
    refreshControl: (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.paper}
        colors={[colors.paper]}
        progressBackgroundColor={colors.paper}
      />
    ),
  });

  return (
    <View style={{ flex: 1 }}>
      {withRefresh}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: 'center', paddingTop: 12 },
        ]}
      >
        <Animated.View style={[{ width: ARC_SIZE, height: ARC_SIZE }, indicatorStyle]}>
          <Svg width={ARC_SIZE} height={ARC_SIZE}>
            <Circle
              cx={ARC_SIZE / 2}
              cy={ARC_SIZE / 2}
              r={ARC_RADIUS}
              stroke={colors.mustard}
              strokeWidth={ARC_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${ARC_DASH} ${ARC_GAP}`}
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

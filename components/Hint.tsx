// First-run hint overlay (1.0.1 Phase E). One sentence, quiet-curator
// register, dismissed by "got it" or a tap anywhere. The first hint a
// player meets also offers "skip the tips" (suppresses all of them).
//
// Built by hand — no spotlight/cutout libraries, no new dependencies.
// Each call site anchors the card next to the thing it describes via
// placement + offset (e.g. above the floating tab bar on tab screens,
// under the header where chat's lock-in button lives). paper-high fill
// plus the md shadow keeps it reading as an overlay in front of the
// content, per the brief's paper-tone elevation model.
//
// Motion: fade + 8pt slide toward its resting spot (transform/opacity
// only, tokens from lib/motion.ts); Reduce Motion drops the entering
// animation entirely, same convention as components/motion/FadeIn.

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import { duration } from '../lib/motion';
import { Typography, radii, shadows, useTheme } from './ui';

export type HintProps = {
  text: string;
  // Show the "skip the tips" secondary action (first hint only).
  showSkip: boolean;
  onDismiss: () => void;
  onSkipAll: () => void;
  // Anchor edge and distance from it. Pick these so the card sits next
  // to the UI the sentence is about (and clear of bars/composers).
  placement?: 'top' | 'bottom';
  offset?: number;
};

export function Hint({
  text,
  showSkip,
  onDismiss,
  onSkipAll,
  placement = 'bottom',
  offset = 28,
}: HintProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Tap anywhere dismisses. Transparent so the screen stays visible. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityLabel="dismiss tip"
      />
      <Animated.View
        entering={
          reduced
            ? undefined
            : FadeInDown.duration(duration.base).withInitialValues({
                opacity: 0,
                // Slide 8pt toward the resting spot: up into place when
                // anchored at the bottom, down into place at the top.
                transform: [{ translateY: placement === 'bottom' ? 8 : -8 }],
              })
        }
        exiting={reduced ? undefined : FadeOut.duration(duration.fast)}
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          ...(placement === 'bottom' ? { bottom: offset } : { top: offset }),
          backgroundColor: colors['paper-high'],
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors['stroke-strong'],
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 10,
          ...shadows.md,
        }}
      >
        <Typography variant="body">{text}</Typography>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Typography variant="caption" color="ink">
              got it
            </Typography>
          </Pressable>
          {showSkip ? (
            <Pressable onPress={onSkipAll} hitSlop={8}>
              <Typography variant="caption" color="ink-soft">
                skip the tips
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

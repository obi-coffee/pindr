// First-run hint overlay (1.0.1 Phase E). One sentence, quiet-curator
// register, dismissed by "got it" or a tap anywhere. The first hint a
// player meets also offers "skip the tips" (suppresses all of them).
//
// Built by hand — no spotlight/cutout libraries, no new dependencies.
// Motion: fade + small upward translate on entry (transform/opacity
// only, tokens from lib/motion.ts); Reduce Motion drops the entering
// animation entirely, same convention as components/motion/FadeIn.

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import { duration } from '../lib/motion';
import { Typography, radii, useTheme } from './ui';

export type HintProps = {
  text: string;
  // Show the "skip the tips" secondary action (first hint only).
  showSkip: boolean;
  onDismiss: () => void;
  onSkipAll: () => void;
};

export function Hint({ text, showSkip, onDismiss, onSkipAll }: HintProps) {
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
                transform: [{ translateY: 8 }],
              })
        }
        exiting={reduced ? undefined : FadeOut.duration(duration.fast)}
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 28,
          backgroundColor: colors['paper-raised'],
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.stroke,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 10,
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

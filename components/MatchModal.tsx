// MatchModal — the Phase 5d "match moment" overlay. Kept on the moss
// background + display-lg headline from the earlier phases (design
// familiarity) but retrofitted with the animation beats from
// Pindr-MicroInteractions-Plan.md §4.1:
//   0. Modal fades in (RN Modal animationType="fade").
//   1. Avatars enter from off-screen with spring.soft, meeting ~60px
//      apart. Mustard accent ring (2px).
//   2. One soft pulse: both scale 1.0 → 1.04 → 1.0 over duration.slow.
//   3. Success haptic fires at pulse peak.
//   4. Headline fades in below the avatars with a 120ms delay.
//   5. "say hi" and "keep swiping" buttons fade up with 60ms stagger.
//
// Reduced-motion variant: no slide, no pulse. Avatars, headline, and
// buttons all fade in together. Haptic still fires — the emotional
// beat shouldn't disappear entirely just because the user dislikes
// motion.

import { useEffect, useRef } from 'react';
import { Image, Modal, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Candidate } from '../lib/discover/queries';
import { useHaptics } from '../lib/haptics';
import { duration, spring } from '../lib/motion';
import { Button, Typography, useTheme } from './ui';

type MatchModalProps = {
  match: Candidate | null;
  myPhotoUrl: string | null;
  onKeepSwiping: () => void;
  onSayHi: () => void;
};

// Timing constants, derived once per render and used by withDelay calls.
// Spring.soft takes roughly 500ms to visually settle; we kick the pulse
// after that so the bump is a separate beat.
const AVATAR_SETTLE_MS = 500;
const PULSE_PEAK_MS = AVATAR_SETTLE_MS + duration.slow / 2;
const HEADLINE_DELAY_MS = AVATAR_SETTLE_MS + 120;
const PRIMARY_DELAY_MS = HEADLINE_DELAY_MS + 60;
const GHOST_DELAY_MS = PRIMARY_DELAY_MS + 60;

export function MatchModal({
  match,
  myPhotoUrl,
  onKeepSwiping,
  onSayHi,
}: MatchModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const haptics = useHaptics();
  const theirPhoto = match?.photo_urls[0];
  const name = match?.display_name ?? 'they';

  const offscreenOffset = width; // start fully off-screen in their direction
  const leftAvatarX = useSharedValue(-offscreenOffset);
  const rightAvatarX = useSharedValue(offscreenOffset);
  const pulseScale = useSharedValue(1);
  const headlineOpacity = useSharedValue(0);
  const primaryOpacity = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);

  const hapticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!match) {
      // Reset for next time the modal opens.
      leftAvatarX.value = -offscreenOffset;
      rightAvatarX.value = offscreenOffset;
      pulseScale.value = 1;
      headlineOpacity.value = 0;
      primaryOpacity.value = 0;
      ghostOpacity.value = 0;
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
      return;
    }

    if (reduced) {
      leftAvatarX.value = 0;
      rightAvatarX.value = 0;
      pulseScale.value = 1;
      headlineOpacity.value = withTiming(1, { duration: duration.base });
      primaryOpacity.value = withTiming(1, { duration: duration.base });
      ghostOpacity.value = withTiming(1, { duration: duration.base });
      haptics.match();
      return;
    }

    leftAvatarX.value = withSpring(0, spring.soft);
    rightAvatarX.value = withSpring(0, spring.soft);

    pulseScale.value = withDelay(
      AVATAR_SETTLE_MS,
      withSequence(
        withTiming(1.04, { duration: duration.slow / 2 }),
        withTiming(1, { duration: duration.slow / 2 }),
      ),
    );

    headlineOpacity.value = withDelay(
      HEADLINE_DELAY_MS,
      withTiming(1, { duration: duration.base }),
    );
    primaryOpacity.value = withDelay(
      PRIMARY_DELAY_MS,
      withTiming(1, { duration: duration.base }),
    );
    ghostOpacity.value = withDelay(
      GHOST_DELAY_MS,
      withTiming(1, { duration: duration.base }),
    );

    hapticTimeoutRef.current = setTimeout(() => {
      haptics.match();
    }, PULSE_PEAK_MS);

    return () => {
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
    };
  }, [
    match,
    reduced,
    haptics,
    leftAvatarX,
    rightAvatarX,
    pulseScale,
    headlineOpacity,
    primaryOpacity,
    ghostOpacity,
    offscreenOffset,
  ]);

  const leftAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftAvatarX.value }, { scale: pulseScale.value }],
  }));
  const rightAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rightAvatarX.value },
      { scale: pulseScale.value },
    ],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
  }));
  const primaryStyle = useAnimatedStyle(() => ({
    opacity: primaryOpacity.value,
  }));
  const ghostStyle = useAnimatedStyle(() => ({
    opacity: ghostOpacity.value,
  }));

  return (
    <Modal
      visible={match !== null}
      transparent={false}
      animationType="fade"
      onRequestClose={onKeepSwiping}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.moss,
          paddingHorizontal: 28,
          paddingTop: 96,
          paddingBottom: 56,
          justifyContent: 'space-between',
        }}
      >
        <Animated.View style={headlineStyle}>
          <Typography variant="caption" color="stone" style={{ marginBottom: 16 }}>
            moment
          </Typography>
          <Typography variant="display-lg" color="paper">
            you found{'\n'}your people.
          </Typography>
          <Typography
            variant="body-lg"
            color="stone"
            style={{ marginTop: 12 }}
          >
            {name} locked in too.
          </Typography>
        </Animated.View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <Animated.View style={leftAvatarStyle}>
            <Avatar uri={myPhotoUrl} ringColor={colors.mustard} />
          </Animated.View>
          <Animated.View style={rightAvatarStyle}>
            <Avatar uri={theirPhoto ?? null} ringColor={colors.mustard} />
          </Animated.View>
        </View>

        <View style={{ gap: 12 }}>
          <Animated.View style={primaryStyle}>
            <Button variant="paper" size="lg" fullWidth onPress={onSayHi}>
              say hi
            </Button>
          </Animated.View>
          <Animated.View style={ghostStyle}>
            <Button variant="mustard" size="lg" fullWidth onPress={onKeepSwiping}>
              keep swiping
            </Button>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

function Avatar({ uri, ringColor }: { uri: string | null; ringColor: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 108,
        height: 108,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: colors['moss-soft'],
        borderWidth: 2,
        borderColor: ringColor,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : null}
    </View>
  );
}

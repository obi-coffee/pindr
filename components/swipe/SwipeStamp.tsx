// Swipe stamps per Pindr-MicroInteractions-Plan.md §4.1. Rendered inside
// rn-swiper-list's OverlayLabel wrappers; the wrapper handles opacity
// interpolation against drag progress (see index.tsx input/output ranges).
// Stamp copy is deliberately not "LIKE" / "NOPE" — that register belongs
// to other dating apps.

import { Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../ui';
import { fontFamilyFor } from '../ui/theme';

type StampSide = 'left' | 'right';

const LABEL_WEIGHT = '800' as const;

function Stamp({
  label,
  side,
  borderColor,
  textColor,
}: {
  label: string;
  side: StampSide;
  borderColor: string;
  textColor: string;
}) {
  const positionStyle: ViewStyle =
    side === 'right'
      ? { top: 36, left: 28, transform: [{ rotate: '-12deg' }] }
      : { top: 36, right: 28, transform: [{ rotate: '12deg' }] };

  return (
    <View
      style={{
        position: 'absolute',
        borderWidth: 3,
        borderRadius: 8,
        borderColor,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
        // Above the card's overflow menu (also zIndex 3) and any other
        // in-card elements. 10 is overkill but harmless.
        zIndex: 10,
        elevation: 10,
        ...positionStyle,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 22,
          fontWeight: LABEL_WEIGHT,
          fontFamily: fontFamilyFor(LABEL_WEIGHT),
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Right swipe — user is about to lock in.
export function LockedInStamp() {
  const { colors } = useTheme();
  return (
    <Stamp
      label="locked in"
      side="right"
      borderColor={colors.success}
      textColor={colors.success}
    />
  );
}

// Left swipe — muted, no hype.
export function MaybeLaterStamp() {
  const { colors } = useTheme();
  return (
    <Stamp
      label="maybe later"
      side="left"
      borderColor={colors['ink-subtle']}
      textColor={colors['ink-subtle']}
    />
  );
}

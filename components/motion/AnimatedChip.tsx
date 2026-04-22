// AnimatedChip — cross-fades background, border, and text color between
// the selected and unselected states over duration.fast. Plan §4.3: "no
// scale change" — only color crosses.
//
// Rendered as two absolutely-positioned color layers stacked behind a
// single text node. Opacity of each layer is the shared value. This keeps
// the animation on transform/opacity only (no layout-triggering
// background-color interpolation).

import { ReactNode, useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration } from '../../lib/motion';

export type ChipPalette = {
  unselectedBg: string;
  unselectedBorder: string;
  unselectedText: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
};

export type AnimatedChipProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  selected: boolean;
  palette: ChipPalette;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AnimatedChip({
  children,
  selected,
  palette,
  containerStyle,
  textStyle,
  ...rest
}: AnimatedChipProps) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: duration.fast });
  }, [selected, progress]);

  const unselectedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const selectedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const selectedTextStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const unselectedTextStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable {...rest} style={containerStyle}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: palette.unselectedBg,
            borderWidth: 1,
            borderColor: palette.unselectedBorder,
            borderRadius: 999,
          },
          unselectedStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: palette.selectedBg,
            borderWidth: 1,
            borderColor: palette.selectedBorder,
            borderRadius: 999,
          },
          selectedStyle,
        ]}
      />
      {/* Two copies of the label stacked, each with opposite opacity. */}
      <View>
        <Animated.Text style={[textStyle, { color: palette.unselectedText }, unselectedTextStyle]}>
          {children}
        </Animated.Text>
        <Animated.Text
          style={[
            textStyle,
            {
              color: palette.selectedText,
              position: 'absolute',
              top: 0,
              left: 0,
            },
            selectedTextStyle,
          ]}
        >
          {children}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

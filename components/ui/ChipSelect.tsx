import { type PressableProps, type ViewStyle } from 'react-native';
import { AnimatedChip } from '../motion/AnimatedChip';
import { useTheme } from './ThemeProvider';
import { fontFamilyFor, radii } from './theme';

type Size = 'sm' | 'md';

export type ChipSelectProps = Omit<PressableProps, 'style' | 'children'> & {
  children: string;
  selected?: boolean;
  size?: Size;
  style?: ViewStyle;
};

const FONT_SIZE: Record<Size, number> = { sm: 10, md: 11 };
const PADDING_V: Record<Size, number> = { sm: 6, md: 7 };
const PADDING_H: Record<Size, number> = { sm: 12, md: 14 };

export function ChipSelect({
  children,
  selected = false,
  size = 'md',
  style,
  ...rest
}: ChipSelectProps) {
  const { colors } = useTheme();
  const fontSize = FONT_SIZE[size];

  return (
    <AnimatedChip
      {...rest}
      selected={selected}
      palette={{
        unselectedBg: 'transparent',
        unselectedBorder: colors['stroke-strong'],
        unselectedText: colors.ink,
        selectedBg: colors.ink,
        selectedBorder: colors.ink,
        selectedText: colors['paper-high'],
      }}
      containerStyle={[
        {
          borderRadius: radii.pill,
          paddingHorizontal: PADDING_H[size],
          paddingVertical: PADDING_V[size],
          alignSelf: 'flex-start',
        },
        style,
      ]}
      textStyle={{
        fontSize,
        lineHeight: fontSize * 1.2,
        fontWeight: '600',
        letterSpacing: fontSize * 0.08,
        textTransform: 'uppercase',
        fontFamily: fontFamilyFor('600'),
      }}
    >
      {children}
    </AnimatedChip>
  );
}

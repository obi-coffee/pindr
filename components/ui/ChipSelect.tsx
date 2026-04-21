import {
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
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
    <Pressable
      {...rest}
      style={[
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: selected ? colors.ink : colors['stroke-strong'],
          paddingHorizontal: PADDING_H[size],
          paddingVertical: PADDING_V[size],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: selected ? colors['paper-high'] : colors.ink,
          fontSize,
          lineHeight: fontSize * 1.2,
          fontWeight: '600',
          letterSpacing: fontSize * 0.08,
          textTransform: 'uppercase',
          fontFamily: fontFamilyFor('600'),
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

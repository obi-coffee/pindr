import { Text, View, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import { fontFamilyFor, radii } from './theme';

type Variant = 'outline' | 'solid';
type Size = 'sm' | 'md';

export type TagProps = {
  children: string;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
};

const FONT_SIZE: Record<Size, number> = { sm: 10, md: 11 };
const PADDING_V: Record<Size, number> = { sm: 4, md: 5 };
const PADDING_H: Record<Size, number> = { sm: 8, md: 10 };

export function Tag({
  children,
  variant = 'outline',
  size = 'md',
  style,
}: TagProps) {
  const { colors } = useTheme();
  const isSolid = variant === 'solid';
  const fontSize = FONT_SIZE[size];

  const container: ViewStyle = {
    backgroundColor: isSolid ? colors.ink : 'transparent',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: isSolid ? colors.ink : colors['stroke-strong'],
    paddingHorizontal: PADDING_H[size],
    paddingVertical: PADDING_V[size],
    alignSelf: 'flex-start',
  };

  return (
    <View style={[container, style]}>
      <Text
        style={{
          color: isSolid ? colors['paper-high'] : colors.ink,
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
    </View>
  );
}

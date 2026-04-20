import { Text, type TextProps } from 'react-native';
import {
  colors,
  fontFamilyFor,
  typography,
  type ColorToken,
  type TypographyVariant,
} from './theme';

export type TypographyProps = TextProps & {
  variant: TypographyVariant;
  color?: ColorToken;
};

export function Typography({
  variant,
  color = 'ink',
  style,
  ...rest
}: TypographyProps) {
  const typeStyle = typography[variant];
  const fontFamily = fontFamilyFor(typeStyle.fontWeight);
  return (
    <Text
      {...rest}
      style={[typeStyle, { fontFamily, color: colors[color] }, style]}
    />
  );
}

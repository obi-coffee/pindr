import {
  ActivityIndicator,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { PressableFade } from '../motion/PressableFade';
import { PressableScale } from '../motion/PressableScale';
import { useTheme } from './ThemeProvider';
import { fontFamilyFor, lightColors, radii } from './theme';

type Variant = 'primary' | 'ghost' | 'destructive' | 'mustard';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 36, md: 42, lg: 48 };
const LABEL_SIZE: Record<Size, number> = { sm: 11, md: 12, lg: 13 };
// 0.1em letter-spacing translated to points per size.
const LABEL_SPACING: Record<Size, number> = {
  sm: 1.1,
  md: 1.2,
  lg: 1.3,
};
const LABEL_WEIGHT = '700' as const;

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const isGhost = variant === 'ghost';
  const isMustard = variant === 'mustard';

  const background = isPrimary
    ? colors.ink
    : isDestructive
      ? colors.burgundy
      : isMustard
        ? colors.mustard
        : 'transparent';
  const labelColor = isGhost
    ? colors.ink
    : isMustard
      ? lightColors.ink
      : colors['paper-high'];
  const borderWidth = isGhost ? 1 : 0;
  const borderColor = colors['stroke-strong'];

  const containerStyle: ViewStyle = {
    height: HEIGHT[size],
    backgroundColor: background,
    borderRadius: radii.pill,
    borderWidth,
    borderColor,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: disabled || loading ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  const labelStyle = {
    color: labelColor,
    fontSize: LABEL_SIZE[size],
    lineHeight: LABEL_SIZE[size] * 1.15,
    fontWeight: LABEL_WEIGHT,
    letterSpacing: LABEL_SPACING[size],
    textTransform: 'uppercase' as const,
    fontFamily: fontFamilyFor(LABEL_WEIGHT),
  };

  const content = loading ? (
    <ActivityIndicator color={labelColor} size="small" />
  ) : (
    <Text style={labelStyle}>{children}</Text>
  );

  // Ghost buttons get the opacity-only fade. Everything else (primary,
  // destructive, mustard) gets the scale+opacity press + haptic.
  if (isGhost) {
    return (
      <PressableFade
        {...rest}
        disabled={disabled || loading}
        style={[containerStyle, style]}
      >
        {content}
      </PressableFade>
    );
  }

  return (
    <PressableScale
      {...rest}
      disabled={disabled || loading}
      style={[containerStyle, style]}
    >
      {content}
    </PressableScale>
  );
}

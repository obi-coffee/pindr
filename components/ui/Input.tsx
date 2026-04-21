import { forwardRef } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { fontFamilyFor, radii } from './theme';
import { Typography } from './Typography';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, containerStyle, multiline, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 6 }}
        >
          {label}
        </Typography>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors['ink-subtle']}
        multiline={multiline}
        {...rest}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.burgundy : colors['stroke-strong'],
          borderRadius: radii.md,
          backgroundColor: colors['paper-high'],
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 17,
          fontFamily: fontFamilyFor('400'),
          color: colors.ink,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? 'top' : 'auto',
        }}
      />
      {error ? (
        <Typography
          variant="body-sm"
          color="burgundy"
          style={{ marginTop: 4 }}
        >
          {error}
        </Typography>
      ) : hint ? (
        <Typography
          variant="body-sm"
          color="ink-subtle"
          style={{ marginTop: 4 }}
        >
          {hint}
        </Typography>
      ) : null}
    </View>
  );
});

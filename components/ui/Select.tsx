import { useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { fontFamilyFor, radii } from './theme';
import { Typography } from './Typography';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  label?: string;
  value: string | null | undefined;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'select',
  hint,
  error,
  containerStyle,
}: SelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

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

      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.burgundy : colors['stroke-strong'],
          borderRadius: radii.md,
          backgroundColor: colors['paper-high'],
          paddingHorizontal: 12,
          paddingVertical: 14,
        }}
      >
        <Typography
          variant="body-lg"
          color={selected ? 'ink' : 'ink-subtle'}
          style={{ fontFamily: fontFamilyFor('400') }}
        >
          {selected?.label ?? placeholder}
        </Typography>
      </Pressable>

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

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
        <View
          style={{
            backgroundColor: colors['paper-high'],
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 12,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 12,
            }}
          >
            <Typography variant="caption" color="ink-soft">
              {label ?? 'select'}
            </Typography>
            <Pressable hitSlop={12} onPress={() => setOpen(false)}>
              <Typography variant="caption" color="ink">
                close
              </Typography>
            </Pressable>
          </View>
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderColor: colors.stroke,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body-lg"
                  color={isSelected ? 'ink' : 'ink-soft'}
                >
                  {opt.label}
                </Typography>
                {isSelected ? (
                  <Typography variant="caption" color="ink">
                    ✓
                  </Typography>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

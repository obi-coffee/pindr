// Shared iOS-style bottom-sheet wrapping @react-native-community/datetimepicker.
// Used by RoundForm's tee-time pickers and the Travel screen's start/end dates.
// On Android the consumer should fall back to DateTimePicker in the default
// dialog mode — this component is iOS-first.

import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Pressable, View } from 'react-native';
import { Typography, useTheme } from './ui';

export type DateTimeSheetProps = {
  visible: boolean;
  mode: 'date' | 'time';
  value: Date;
  onChange: (next: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
};

export function DateTimeSheet({
  visible,
  mode,
  value,
  onChange,
  onClose,
  minimumDate,
}: DateTimeSheetProps) {
  const { colors, scheme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
      />
      <View
        style={{
          backgroundColor: colors['paper-high'],
          paddingHorizontal: 16,
          paddingBottom: 28,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingVertical: 10,
          }}
        >
          <Pressable hitSlop={12} onPress={onClose}>
            <Typography variant="caption" color="ink">
              done
            </Typography>
          </Pressable>
        </View>
        <DateTimePicker
          mode={mode}
          display={mode === 'date' ? 'inline' : 'spinner'}
          value={value}
          minimumDate={minimumDate}
          onChange={(_, next) => {
            if (next) onChange(next);
          }}
          themeVariant={scheme}
        />
      </View>
    </Modal>
  );
}

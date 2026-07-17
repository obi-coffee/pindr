import { View } from 'react-native';
import { ChipSelect } from './ui';
import {
  AVAILABILITY_SLOTS,
  type AvailabilitySlotId,
} from '../lib/profile/availability';

// Multi-select chip row for availability slots. Used by the edit screen
// and the onboarding questions step; both own the selection state.

export type AvailabilityPickerProps = {
  selected: Set<AvailabilitySlotId | string>;
  onToggle: (id: AvailabilitySlotId) => void;
};

export function AvailabilityPicker({
  selected,
  onToggle,
}: AvailabilityPickerProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {AVAILABILITY_SLOTS.map((slot) => (
        <ChipSelect
          key={slot.id}
          selected={selected.has(slot.id)}
          onPress={() => onToggle(slot.id)}
        >
          {slot.label}
        </ChipSelect>
      ))}
    </View>
  );
}

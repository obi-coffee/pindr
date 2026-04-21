import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ChipSelect, Typography, useTheme } from './ui';
import { CoursePickerModal } from './CoursePickerModal';
import type { CourseSummary } from '../lib/rounds/queries';

export type DatePreset = 'today' | 'week' | '30d';

export type RoundsFilters = {
  preset: DatePreset;
  course: CourseSummary | null;
};

export type RoundsFilterBarProps = {
  value: RoundsFilters;
  onChange: (next: RoundsFilters) => void;
};

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: '30d', label: 'Next 30 days' },
];

export function RoundsFilterBar({ value, onChange }: RoundsFilterBarProps) {
  const { colors } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View
      style={{
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {PRESET_OPTIONS.map((opt) => (
          <ChipSelect
            key={opt.value}
            selected={value.preset === opt.value}
            onPress={() => onChange({ ...value, preset: opt.value })}
          >
            {opt.label}
          </ChipSelect>
        ))}
        <View style={{ width: 8 }} />
        <ChipSelect
          selected={Boolean(value.course)}
          onPress={() => {
            if (value.course) {
              onChange({ ...value, course: null });
            } else {
              setPickerOpen(true);
            }
          }}
        >
          {value.course ? `${value.course.name}  ×` : 'Any course'}
        </ChipSelect>
      </ScrollView>

      {value.course ? (
        <Typography
          variant="card-stat-label"
          color="ink-subtle"
          style={{ paddingHorizontal: 20, marginTop: 8 }}
        >
          {[value.course.city, value.course.state].filter(Boolean).join(', ')}
        </Typography>
      ) : null}

      <CoursePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(course) => onChange({ ...value, course })}
      />
    </View>
  );
}

export function presetRange(preset: DatePreset): {
  from: Date;
  to: Date | null;
} {
  const now = new Date();
  if (preset === 'today') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: now, to: end };
  }
  if (preset === 'week') {
    const end = new Date(now);
    const daysUntilSunday = (7 - end.getDay()) % 7;
    end.setDate(end.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    return { from: now, to: end };
  }
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  end.setHours(23, 59, 59, 999);
  return { from: now, to: end };
}

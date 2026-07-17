// Generic renderer for one ProfileQuestion. Owns no state — value in,
// onChange out — so the parent can persist however it likes (in the
// onboarding screen we collect into a local map and write all answers
// at once on submit; the edit screen does write-through per question).

import { TextInput, View } from 'react-native';
import { ChipSelect, Typography, fontFamilyFor, radii, useTheme } from './ui';
import type { ProfileQuestion } from '../lib/profile/questions';

export type QuestionPickerProps = {
  question: ProfileQuestion;
  value: string;
  onChange: (next: string) => void;
};

export function QuestionPicker({
  question,
  value,
  onChange,
}: QuestionPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Typography variant="body-lg">{question.prompt}</Typography>
      {question.type === 'choice' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {question.options.map((option) => (
            <ChipSelect
              key={option}
              selected={value === option}
              onPress={() => onChange(value === option ? '' : option)}
            >
              {option}
            </ChipSelect>
          ))}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={question.placeholder}
          placeholderTextColor={colors['ink-subtle']}
          multiline
          maxLength={240}
          style={{
            borderWidth: 1,
            borderColor: colors['stroke-strong'],
            borderRadius: radii.md,
            backgroundColor: colors['paper-high'],
            paddingHorizontal: 12,
            paddingVertical: 12,
            minHeight: 72,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fontFamilyFor('400'),
            color: colors.ink,
            textAlignVertical: 'top',
          }}
        />
      )}
    </View>
  );
}

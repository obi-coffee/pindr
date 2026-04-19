import { Pressable, Text, TextInput, View } from 'react-native';

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, ...input }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        {...input}
        className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
      />
      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-slate-400">{hint}</Text>
      ) : null}
    </View>
  );
}

type ChipGroupProps<T extends string> = {
  label: string;
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  error?: string;
};

export function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
}: ChipGroupProps<T>) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-medium text-slate-700">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`rounded-full border px-4 py-2 active:opacity-80 ${
                selected
                  ? 'border-emerald-600 bg-emerald-600'
                  : 'border-slate-300 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? 'text-white' : 'text-slate-700'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}

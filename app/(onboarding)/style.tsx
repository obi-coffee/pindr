import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../../components/BrandMark';
import {
  Button,
  ChipSelect,
  Typography,
  useTheme,
} from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { styleSchema, type StyleInput } from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

type ChipGroupProps<T extends string> = {
  label: string;
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  error?: string;
};

function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
}: ChipGroupProps<T>) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Typography
        variant="caption"
        color="ink-soft"
        style={{ marginBottom: 10 }}
      >
        {label}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <ChipSelect
            key={opt.value}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
          >
            {opt.label}
          </ChipSelect>
        ))}
      </View>
      {error ? (
        <Typography
          variant="body-sm"
          color="burgundy"
          style={{ marginTop: 6 }}
        >
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

export default function Style() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StyleInput>({
    resolver: zodResolver(styleSchema),
    defaultValues: {
      walking_preference: profile?.walking_preference ?? undefined,
      holes_preference: profile?.holes_preference ?? undefined,
      pace: profile?.pace ?? undefined,
      betting: profile?.betting ?? undefined,
      drinks: profile?.drinks ?? undefined,
      post_round: profile?.post_round ?? undefined,
      teaching_mindset: profile?.teaching_mindset ?? undefined,
      style_default: profile?.style_default ?? undefined,
    },
  });

  const onSubmit = async (values: StyleInput) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(values)
      .eq('user_id', user.id);
    if (error) {
      Alert.alert('could not save', error.message);
      return;
    }
    await refetchProfile();
    router.push('/photos');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <BrandMark />
          <Typography
            variant="caption"
            color="ink-soft"
            style={{ marginBottom: 8 }}
          >
            step 3 of 6
          </Typography>
          <Typography variant="h1" style={{ marginBottom: 6 }}>
            how you play.
          </Typography>
          <Typography
            variant="body"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            pick what's true most of the time.
          </Typography>

          <Controller
            control={control}
            name="style_default"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="Style for a typical round"
                value={value}
                onChange={onChange}
                error={errors.style_default?.message}
                options={[
                  { value: 'relaxed', label: 'Relaxed' },
                  { value: 'improvement', label: 'Improvement' },
                  { value: 'competitive', label: 'Competitive' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="pace"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="Pace of play"
                value={value}
                onChange={onChange}
                error={errors.pace?.message}
                options={[
                  { value: 'chill', label: 'Chill' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'ready', label: 'Ready golf' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="walking_preference"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="Walk or ride"
                value={value}
                onChange={onChange}
                error={errors.walking_preference?.message}
                options={[
                  { value: 'walk', label: 'Walk' },
                  { value: 'ride', label: 'Ride' },
                  { value: 'either', label: 'Either' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="holes_preference"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="9, 18, or either"
                value={value}
                onChange={onChange}
                error={errors.holes_preference?.message}
                options={[
                  { value: '9', label: '9' },
                  { value: '18', label: '18' },
                  { value: 'either', label: 'Either' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="teaching_mindset"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="On the course…"
                value={value}
                onChange={onChange}
                error={errors.teaching_mindset?.message}
                options={[
                  { value: 'open_to_tips', label: 'Open to tips' },
                  { value: 'just_play', label: 'Just play' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="betting"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="Betting"
                value={value}
                onChange={onChange}
                error={errors.betting?.message}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'small', label: 'Small stakes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="drinks"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="Drinks on course"
                value={value}
                onChange={onChange}
                error={errors.drinks?.message}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'sometimes', label: 'Sometimes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="post_round"
            render={({ field: { value, onChange } }) => (
              <ChipGroup
                label="After the round"
                value={value}
                onChange={onChange}
                error={errors.post_round?.message}
                options={[
                  { value: 'hangout', label: 'Food & drinks' },
                  { value: 'just_round', label: 'Just the round' },
                ]}
              />
            )}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={{ marginTop: 8 }}
          >
            Continue
          </Button>

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 20, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-subtle">
              back
            </Typography>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChipGroup } from '../../components/form';
import { useAuth } from '../../lib/auth/AuthProvider';
import { styleSchema, type StyleInput } from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

export default function Style() {
  const { user, profile, refetchProfile } = useAuth();

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
      Alert.alert('Could not save', error.message);
      return;
    }
    await refetchProfile();
    router.push('/photos');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Step 3 of 6
          </Text>
          <Text className="mb-2 text-3xl font-bold text-slate-900">
            How you play
          </Text>
          <Text className="mb-8 text-base text-slate-500">
            Pick what's true most of the time.
          </Text>

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
                label="Walk or ride?"
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
                label="9, 18, or either?"
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

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`mt-2 items-center rounded-lg py-3 ${
              isSubmitting ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {isSubmitting ? 'Saving…' : 'Continue'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">Back</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

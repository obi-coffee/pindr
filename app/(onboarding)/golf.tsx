import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '../../components/form';
import { useAuth } from '../../lib/auth/AuthProvider';
import { golfSchema, type GolfInput } from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

export default function Golf() {
  const { user, profile, refetchProfile } = useAuth();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GolfInput>({
    resolver: zodResolver(golfSchema),
    defaultValues: {
      has_handicap: profile?.has_handicap ?? false,
      handicap: profile?.handicap ?? undefined,
      years_playing: profile?.years_playing ?? undefined,
      home_course_name: profile?.home_course_name ?? '',
    },
  });

  const hasHandicap = watch('has_handicap');

  const onSubmit = async (values: GolfInput) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        has_handicap: values.has_handicap,
        handicap: values.has_handicap ? values.handicap : null,
        years_playing: values.years_playing,
        home_course_name: values.home_course_name || null,
      })
      .eq('user_id', user.id);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refetchProfile();
    router.push('/style');
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
            Step 2 of 6
          </Text>
          <Text className="mb-2 text-3xl font-bold text-slate-900">
            Your golf
          </Text>
          <Text className="mb-8 text-base text-slate-500">
            This helps us match you with compatible players.
          </Text>

          <Controller
            control={control}
            name="has_handicap"
            render={({ field: { value, onChange } }) => (
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-medium text-slate-700">
                    I have a handicap
                  </Text>
                  <Text className="text-xs text-slate-400">
                    Toggle off if you are new or don't track one.
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={(v) => {
                    onChange(v);
                    if (!v) setValue('handicap', undefined);
                  }}
                />
              </View>
            )}
          />

          {hasHandicap ? (
            <Controller
              control={control}
              name="handicap"
              render={({ field: { value, onChange, onBlur } }) => (
                <Field
                  label="Handicap index"
                  error={errors.handicap?.message}
                  value={value === undefined ? '' : String(value)}
                  onChangeText={(t) =>
                    onChange(t === '' ? undefined : Number(t))
                  }
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 14.2"
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="years_playing"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field
                label="Years playing"
                error={errors.years_playing?.message}
                value={value === undefined ? '' : String(value)}
                onChangeText={(t) =>
                  onChange(t === '' ? undefined : Number(t))
                }
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="5"
              />
            )}
          />

          <Controller
            control={control}
            name="home_course_name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field
                label="Home course (optional)"
                error={errors.home_course_name?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Bethpage Black"
                hint="Free text for now. We'll add a course picker later."
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

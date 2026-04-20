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
import { Field } from '../../../components/form';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { basicsSchema, type BasicsInput } from '../../../lib/profile/schemas';
import { supabase } from '../../../lib/supabase';

export default function EditBasics() {
  const { user, profile, refetchProfile } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      age: profile?.age ?? undefined,
      gender: profile?.gender ?? '',
      pronouns: profile?.pronouns ?? '',
      bio: profile?.bio ?? '',
    },
  });

  const onSubmit = async (values: BasicsInput) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: values.display_name,
        age: values.age,
        gender: values.gender || null,
        pronouns: values.pronouns || null,
        bio: values.bio || null,
      })
      .eq('user_id', user.id);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refetchProfile();
    router.back();
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
          <Text className="mb-6 text-3xl font-bold text-slate-900">
            Edit basics
          </Text>

          <Controller
            control={control}
            name="display_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="First name"
                error={errors.display_name?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Age"
                error={errors.age?.message}
                value={
                  value === undefined || Number.isNaN(value) ? '' : String(value)
                }
                onChangeText={(t) => {
                  if (t === '') return onChange(undefined);
                  const n = Number(t);
                  onChange(Number.isNaN(n) ? undefined : n);
                }}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Gender"
                error={errors.gender?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="pronouns"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Pronouns"
                error={errors.pronouns?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Bio"
                error={errors.bio?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
              {isSubmitting ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

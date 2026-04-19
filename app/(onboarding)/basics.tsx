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
import { Field } from '../../components/form';
import { useAuth } from '../../lib/auth/AuthProvider';
import { basicsSchema, type BasicsInput } from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

export default function Basics() {
  const { user, profile, refetchProfile, signOut } = useAuth();

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
    router.push('/golf');
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
            Step 1 of 6
          </Text>
          <Text className="mb-2 text-3xl font-bold text-slate-900">
            The basics
          </Text>
          <Text className="mb-8 text-base text-slate-500">
            Just the essentials to get started.
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
                placeholder="Obi"
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
                value={value === undefined ? '' : String(value)}
                onChangeText={(t) => onChange(t === '' ? undefined : Number(t))}
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="27"
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Gender (optional)"
                error={errors.gender?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Woman, man, non-binary…"
              />
            )}
          />

          <Controller
            control={control}
            name="pronouns"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Pronouns (optional)"
                error={errors.pronouns?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="she/her, he/him, they/them…"
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Short bio (optional)"
                error={errors.bio?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="What's your golf story?"
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
              {isSubmitting ? 'Saving…' : 'Continue'}
            </Text>
          </Pressable>

          <Pressable
            onPress={signOut}
            className="mt-8 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-400">Sign out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../../components/BrandMark';
import { Button, Input, Select, Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  basicsSchema,
  GENDER_OPTIONS,
  type BasicsForm,
  type BasicsInput,
} from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

export default function Basics() {
  const { user, profile, refetchProfile, signOut } = useAuth();
  const { colors } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BasicsForm, unknown, BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      age: profile?.age != null ? String(profile.age) : '',
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
      Alert.alert('could not save', error.message);
      return;
    }
    await refetchProfile();
    router.push('/golf');
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
            step 1 of 6
          </Typography>
          <Typography variant="h1" style={{ marginBottom: 6 }}>
            the basics.
          </Typography>
          <Typography
            variant="body"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            just the essentials to get started.
          </Typography>

          <Controller
            control={control}
            name="display_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="First name"
                error={errors.display_name?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="obi"
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Age"
                error={errors.age?.message}
                value={value == null ? '' : String(value)}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="27"
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Gender (optional)"
                error={errors.gender?.message}
                value={value ?? null}
                options={[...GENDER_OPTIONS]}
                onChange={onChange}
                placeholder="select"
              />
            )}
          />

          <Controller
            control={control}
            name="pronouns"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
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
              <Input
                label="Short bio (optional)"
                error={errors.bio?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="what's your golf story?"
                multiline
                numberOfLines={4}
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
            onPress={signOut}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 28, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-subtle">
              sign out
            </Typography>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

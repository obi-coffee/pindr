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
import { Input, Select, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  basicsSchema,
  GENDER_OPTIONS,
  type BasicsInput,
} from '../../../lib/profile/schemas';
import { supabase } from '../../../lib/supabase';

export default function EditBasics() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();

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
      Alert.alert('could not save', error.message);
      return;
    }
    await refetchProfile();
    router.back();
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
        <EditHeader
          title="edit basics"
          onSave={handleSubmit(onSubmit)}
          saving={isSubmitting}
        />

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
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
            render={({ field: { onChange, value } }) => (
              <Select
                label="Gender"
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
              <Input
                label="Bio"
                error={errors.bio?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function EditHeader({
  title,
  onSave,
  saving,
  saveLabel = 'save',
}: {
  title: string;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.stroke,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ minWidth: 48 }}
      >
        <Typography variant="caption" color="ink-soft">
          cancel
        </Typography>
      </Pressable>
      <Typography variant="caption" color="ink">
        {title}
      </Typography>
      {onSave ? (
        <Pressable
          onPress={onSave}
          disabled={saving}
          hitSlop={8}
          style={{ minWidth: 48, alignItems: 'flex-end' }}
        >
          <Typography variant="caption" color={saving ? 'ink-subtle' : 'ink'}>
            {saving ? 'saving…' : saveLabel}
          </Typography>
        </Pressable>
      ) : (
        <View style={{ minWidth: 48 }} />
      )}
    </View>
  );
}

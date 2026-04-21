import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { golfSchema, type GolfInput } from '../../../lib/profile/schemas';
import { supabase } from '../../../lib/supabase';
import { EditHeader } from './basics';

export default function EditGolf() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();

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
          title="edit golf"
          onSave={handleSubmit(onSubmit)}
          saving={isSubmitting}
        />
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="has_handicap"
            render={({ field: { value, onChange } }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colors.stroke,
                  marginBottom: 16,
                }}
              >
                <Typography variant="body-lg" style={{ flex: 1 }}>
                  I have a handicap
                </Typography>
                <Switch
                  value={value}
                  onValueChange={(v) => {
                    onChange(v);
                    if (!v) setValue('handicap', undefined);
                  }}
                  trackColor={{
                    false: colors['stroke-strong'],
                    true: colors.ink,
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
                <Input
                  label="Handicap index"
                  error={errors.handicap?.message}
                  value={
                    value === undefined || Number.isNaN(value)
                      ? ''
                      : String(value)
                  }
                  onChangeText={(t) => {
                    if (t === '') return onChange(undefined);
                    const n = Number(t);
                    onChange(Number.isNaN(n) ? undefined : n);
                  }}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="years_playing"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Years playing"
                error={errors.years_playing?.message}
                value={
                  value === undefined || Number.isNaN(value)
                    ? ''
                    : String(value)
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
            name="home_course_name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Home course"
                error={errors.home_course_name?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

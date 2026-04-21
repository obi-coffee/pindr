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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { golfSchema, type GolfInput } from '../../lib/profile/schemas';
import { supabase } from '../../lib/supabase';

export default function Golf() {
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
    router.push('/style');
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
          <Typography
            variant="caption"
            color="ink-soft"
            style={{ marginBottom: 8 }}
          >
            step 2 of 6
          </Typography>
          <Typography variant="h1" style={{ marginBottom: 6 }}>
            your golf.
          </Typography>
          <Typography
            variant="body"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            this helps us match you with people who play your kind of round.
          </Typography>

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
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Typography variant="body-lg">I have a handicap</Typography>
                  <Typography
                    variant="body-sm"
                    color="ink-soft"
                    style={{ marginTop: 2 }}
                  >
                    toggle off if you're new or don't track one.
                  </Typography>
                </View>
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
                  placeholder="e.g. 14.2"
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
                placeholder="5"
              />
            )}
          />

          <Controller
            control={control}
            name="home_course_name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Home course (optional)"
                error={errors.home_course_name?.message}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Bethpage Black"
                hint="free text for now. course picker lands later."
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

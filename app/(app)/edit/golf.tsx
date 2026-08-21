import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { KeyboardAvoider } from '../../../components/KeyboardAvoider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoursePickerInput } from '../../../components/CoursePickerInput';
import { HandicapInput } from '../../../components/HandicapInput';
import { Input, Typography, useTheme } from '../../../components/ui';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
  golfSchema,
  type GolfForm,
  type GolfInput,
} from '../../../lib/profile/schemas';
import { supabase } from '../../../lib/supabase';
import { EditHeader } from './basics';

export default function EditGolf() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();
  // Whether the currently linked home course is a private club — the
  // host toggle only exists in that world. Free text (no id) is never
  // private.
  const [homeCourseIsPrivate, setHomeCourseIsPrivate] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GolfForm, unknown, GolfInput>({
    resolver: zodResolver(golfSchema),
    defaultValues: {
      has_handicap: profile?.has_handicap ?? false,
      handicap: profile?.handicap ?? undefined,
      years_playing:
        profile?.years_playing != null ? String(profile.years_playing) : '',
      home_course_name: profile?.home_course_name ?? '',
      home_course_id: profile?.home_course_id ?? null,
      can_host_guests: profile?.can_host_guests ?? false,
    },
  });

  const hasHandicap = watch('has_handicap');
  const homeCourseId = watch('home_course_id');

  useEffect(() => {
    let cancelled = false;
    if (!homeCourseId) {
      setHomeCourseIsPrivate(false);
      return;
    }
    supabase
      .from('courses')
      .select('is_public')
      .eq('id', homeCourseId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setHomeCourseIsPrivate(data ? !data.is_public : false);
      });
    return () => {
      cancelled = true;
    };
  }, [homeCourseId]);

  const onSubmit = async (values: GolfInput) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        has_handicap: values.has_handicap,
        handicap: values.has_handicap ? values.handicap : null,
        years_playing: values.years_playing,
        home_course_name: values.home_course_name || null,
        home_course_id: values.home_course_name ? (values.home_course_id ?? null) : null,
        // The flag never survives leaving a private club.
        can_host_guests:
          homeCourseIsPrivate && !!values.home_course_name && !!values.home_course_id
            ? (values.can_host_guests ?? false)
            : false,
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
      <KeyboardAvoider>
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
                <HandicapInput
                  value={typeof value === 'number' ? value : undefined}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.handicap?.message}
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
                value={value == null ? '' : String(value)}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="home_course_name"
            render={({ field: { value, onChange, onBlur } }) => (
              <CoursePickerInput
                label="Home course"
                error={errors.home_course_name?.message}
                value={value ?? ''}
                onChangeText={(t) => {
                  onChange(t);
                  // Typing free text breaks the structured link; only a
                  // pick from the list restores it.
                  setValue('home_course_id', null);
                }}
                onSelect={(course) => setValue('home_course_id', course.id)}
                onBlur={onBlur}
                autoCorrect={false}
              />
            )}
          />

          {homeCourseIsPrivate ? (
            <Controller
              control={control}
              name="can_host_guests"
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
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Typography variant="body-lg">
                      can host guests at my club
                    </Typography>
                    <Typography variant="body-sm" color="ink-soft">
                      shows on your profile. no bookings — it just starts
                      the conversation.
                    </Typography>
                  </View>
                  <Switch
                    value={!!value}
                    onValueChange={onChange}
                    trackColor={{
                      false: colors['stroke-strong'],
                      true: colors.ink,
                    }}
                  />
                </View>
              )}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
} from 'react-native';
import { KeyboardAvoider } from '../components/KeyboardAvoider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { useToast } from '../components/motion/Toast';
import { Button, Input, Typography, useTheme } from '../components/ui';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '../lib/auth/schemas';
import { supabase } from '../lib/supabase';

// Lives outside (auth) and (app) so the recovery session — set by the
// deep-link code exchange — doesn't bounce the user into the gated
// onboarding redirect or back to sign-in before they can pick a new
// password. After the update succeeds we sign out and route to /sign-in
// so they re-authenticate with the fresh credential.
export default function ResetPassword() {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      Alert.alert("couldn't update password", error.message);
      return;
    }
    await supabase.auth.signOut();
    showToast('password updated. sign in again to continue.');
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <KeyboardAvoider>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <BrandMark />
          <Typography variant="display-lg" style={{ marginBottom: 12 }}>
            new password.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            pick something at least 8 characters.
          </Typography>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New password"
                error={errors.password?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="••••••••"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm new password"
                error={errors.confirmPassword?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="••••••••"
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
            Save password
          </Button>
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

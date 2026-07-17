import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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
import { BrandMark } from '../../components/BrandMark';
import { useToast } from '../../components/motion/Toast';
import { Button, Input, Typography, useTheme } from '../../components/ui';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

const REDIRECT_URL = 'pindr://reset-password';

export default function ForgotPassword() {
  const { colors } = useTheme();
  const { show: showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      values.email.trim(),
      { redirectTo: REDIRECT_URL },
    );
    if (error) {
      Alert.alert("couldn't send reset link", error.message);
      return;
    }
    showToast('check your inbox for a reset link.');
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
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <BrandMark />
          <Typography variant="display-lg" style={{ marginBottom: 12 }}>
            forgot password.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            enter your email and we'll send a link to set a new one.
          </Typography>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                error={errors.email?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
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
            Send reset link
          </Button>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 28,
            }}
          >
            <Link href="/sign-in" asChild>
              <Pressable hitSlop={8}>
                <Typography variant="body-sm" color="ink-soft">
                  back to sign in
                </Typography>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

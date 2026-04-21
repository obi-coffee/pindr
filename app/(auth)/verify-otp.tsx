import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Typography, useTheme } from '../../components/ui';
import { otpSchema, type OtpInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function VerifyOtp() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { colors } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: OtpInput) => {
    if (!phone) {
      Alert.alert('missing phone number', 'go back and enter your number again.');
      return;
    }
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) Alert.alert('verification failed', error.message);
  };

  const resend = async () => {
    if (!phone) return;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    Alert.alert(
      error ? 'resend failed' : 'code resent',
      error ? error.message : `new code sent to ${phone}.`,
    );
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
            style={{ marginBottom: 10, marginTop: 12 }}
          >
            pindr
          </Typography>
          <Typography variant="display-lg" style={{ marginBottom: 12 }}>
            check your texts.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            {phone
              ? `we sent a code to ${phone}.`
              : 'we sent a code to your phone.'}
          </Typography>

          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="6-digit code"
                error={errors.code?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
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
            Verify
          </Button>

          <Pressable
            onPress={resend}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 20, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-soft">
              didn't get it? resend code
            </Typography>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-subtle">
              change phone number
            </Typography>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

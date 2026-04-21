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
import { Button, Input, Typography, colors } from '../../components/ui';
import { phoneSchema, type PhoneInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function Phone() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async ({ phone }: PhoneInput) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      Alert.alert('could not send code', error.message);
      return;
    }
    router.push({ pathname: '/verify-otp', params: { phone } });
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
            sign in by phone.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            we'll text you a 6-digit code. no passwords.
          </Typography>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone number"
                error={errors.phone?.message}
                hint="include the country code, e.g. +1 for the US."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder="+15551234567"
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
            Send code
          </Button>

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 20, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-subtle">
              use email instead
            </Typography>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

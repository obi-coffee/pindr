import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { otpSchema, type OtpInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function VerifyOtp() {
  const { phone } = useLocalSearchParams<{ phone: string }>();

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
      Alert.alert('Missing phone number', 'Go back and enter your number again.');
      return;
    }
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) Alert.alert('Verification failed', error.message);
    // On success, AuthProvider's onAuthStateChange flips the app to signed-in.
  };

  const resend = async () => {
    if (!phone) return;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    Alert.alert(
      error ? 'Resend failed' : 'Code resent',
      error ? error.message : `New code sent to ${phone}`,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-4xl font-bold text-emerald-600">Pindr</Text>
          <Text className="mb-8 text-base text-slate-500">
            Enter the code we sent to {phone ?? 'your phone'}
          </Text>

          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="mb-1 text-sm font-medium text-slate-700">
                  6-digit code
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  className={`rounded-lg border bg-white px-3 py-3 text-2xl tracking-widest text-slate-900 ${
                    errors.code ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.code ? (
                  <Text className="mt-1 text-xs text-red-500">
                    {errors.code.message}
                  </Text>
                ) : null}
              </View>
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
              {isSubmitting ? 'Verifying…' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable
            onPress={resend}
            className="mt-6 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">
              Didn't get it? Resend code
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-2 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-400">
              Change phone number
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

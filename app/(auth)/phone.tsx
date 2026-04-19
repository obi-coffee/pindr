import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
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
      Alert.alert('Could not send code', error.message);
      return;
    }
    router.push({ pathname: '/verify-otp', params: { phone } });
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
            We'll text you a 6-digit code
          </Text>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="mb-1 text-sm font-medium text-slate-700">
                  Phone number
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                  placeholder="+15551234567"
                  placeholderTextColor="#94a3b8"
                  className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 ${
                    errors.phone ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.phone ? (
                  <Text className="mt-1 text-xs text-red-500">
                    {errors.phone.message}
                  </Text>
                ) : (
                  <Text className="mt-1 text-xs text-slate-400">
                    Include country code, e.g. +1 for the US.
                  </Text>
                )}
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
              {isSubmitting ? 'Sending…' : 'Send code'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-slate-500">
              Use email instead
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

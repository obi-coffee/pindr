import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useState } from 'react';
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
import { signUpSchema, type SignUpInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptGuidelines: false,
    },
  });

  const onSubmit = async (values: SignUpInput) => {
    const email = values.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: values.password,
      options: { emailRedirectTo: Linking.createURL('/') },
    });
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.session) {
      // Email confirmation is disabled in Supabase — session is live now,
      // AuthProvider will route us to the signed-in home.
      return;
    }
    setSentTo(email);
  };

  if (sentTo) return <CheckInbox email={sentTo} onBack={() => setSentTo(null)} />;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-4xl font-bold text-emerald-600">Pindr</Text>
          <Text className="mb-8 text-base text-slate-500">Create your account</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Password"
                error={errors.password?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="At least 8 characters"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Confirm password"
                error={errors.confirmPassword?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="Re-enter password"
              />
            )}
          />

          <Controller
            control={control}
            name="acceptGuidelines"
            render={({ field: { value, onChange } }) => (
              <View className="mb-4">
                <Pressable
                  onPress={() => onChange(!value)}
                  className="flex-row items-start active:opacity-80"
                  hitSlop={4}
                >
                  <View
                    className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                      value
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {value ? (
                      <Text className="text-xs font-bold text-white">✓</Text>
                    ) : null}
                  </View>
                  <Text className="flex-1 text-sm text-slate-700">
                    I agree to the{' '}
                    <Text
                      className="font-semibold text-emerald-600"
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/guidelines' as never);
                      }}
                    >
                      community guidelines
                    </Text>
                    .
                  </Text>
                </Pressable>
                {errors.acceptGuidelines ? (
                  <Text className="mt-1 text-xs text-red-500">
                    {errors.acceptGuidelines.message}
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-slate-500">Already have an account? </Text>
            <Link href="/sign-in" className="text-sm font-semibold text-emerald-600">
              Sign in
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckInbox({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-3xl font-bold text-emerald-600">
          Check your inbox
        </Text>
        <Text className="mb-6 text-center text-base text-slate-600">
          We sent a confirmation link to{'\n'}
          <Text className="font-semibold text-slate-900">{email}</Text>
        </Text>
        <Text className="mb-10 text-center text-sm text-slate-400">
          Tap the link on this device to finish signing up.
        </Text>

        <Pressable
          onPress={onBack}
          className="rounded-lg border border-slate-300 px-6 py-3 active:opacity-70"
        >
          <Text className="text-base font-medium text-slate-700">
            Use a different email
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

function Field({ label, error, ...input }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        {...input}
        className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
      />
      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}

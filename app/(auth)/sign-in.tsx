import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
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
import { signInSchema, type SignInInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });
    if (error) Alert.alert('Sign in failed', error.message);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-4xl font-bold text-emerald-600">
            Pindr
          </Text>
          <Text className="mb-8 text-base text-slate-500">
            Sign in to continue
          </Text>

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
                placeholder="••••••••"
              />
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
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-slate-500">New to Pindr? </Text>
            <Link href="/sign-up" className="text-sm font-semibold text-emerald-600">
              Create an account
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
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

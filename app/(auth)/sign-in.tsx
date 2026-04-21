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
import { Button, Input, Typography, useTheme } from '../../components/ui';
import { signInSchema, type SignInInput } from '../../lib/auth/schemas';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const { colors } = useTheme();
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
    if (error) Alert.alert('sign in failed', error.message);
  };

  const disabled = isSubmitting;

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
            welcome back.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            take the random out of randoms.
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
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

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={disabled}
            onPress={handleSubmit(onSubmit)}
            style={{ marginTop: 8 }}
          >
            Sign in
          </Button>

          <Pressable
            onPress={() => router.push('/phone' as never)}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 8 }}
          >
            <Typography variant="caption" color="ink-soft">
              use phone instead
            </Typography>
          </Pressable>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 28,
              gap: 6,
            }}
          >
            <Typography variant="body-sm" color="ink-soft">
              new to pindr?
            </Typography>
            <Link href="/sign-up" asChild>
              <Pressable hitSlop={8}>
                <Typography variant="body-sm" color="ink">
                  get started
                </Typography>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

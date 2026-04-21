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
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Typography, colors } from '../../components/ui';
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
      Alert.alert('sign up failed', error.message);
      return;
    }
    if (data.session) return;
    setSentTo(email);
  };

  if (sentTo) return <CheckInbox email={sentTo} onBack={() => setSentTo(null)} />;

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
            find your{'\n'}foursome.
          </Typography>
          <Typography
            variant="body-lg"
            color="ink-soft"
            style={{ marginBottom: 28 }}
          >
            first-timers to straight-up ringers. everyone belongs.
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
                placeholder="at least 8 characters"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm password"
                error={errors.confirmPassword?.message}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="re-enter password"
              />
            )}
          />

          <Controller
            control={control}
            name="acceptGuidelines"
            render={({ field: { value, onChange } }) => (
              <View style={{ marginBottom: 4 }}>
                <Pressable
                  onPress={() => onChange(!value)}
                  hitSlop={4}
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: value ? colors.ink : colors['stroke-strong'],
                      backgroundColor: value ? colors.ink : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    {value ? (
                      <Typography variant="caption" color="paper-high">
                        ✓
                      </Typography>
                    ) : null}
                  </View>
                  <Typography variant="body-sm" color="ink" style={{ flex: 1 }}>
                    i agree to the{' '}
                    <Typography
                      variant="body-sm"
                      color="ink"
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/guidelines' as never);
                      }}
                      style={{ fontWeight: '700' }}
                    >
                      community guidelines
                    </Typography>
                    .
                  </Typography>
                </Pressable>
                {errors.acceptGuidelines ? (
                  <Typography
                    variant="body-sm"
                    color="burgundy"
                    style={{ marginTop: 4, marginLeft: 32 }}
                  >
                    {errors.acceptGuidelines.message}
                  </Typography>
                ) : null}
              </View>
            )}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={{ marginTop: 20 }}
          >
            Get started
          </Button>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 28,
              gap: 6,
            }}
          >
            <Typography variant="body-sm" color="ink-soft">
              already in?
            </Typography>
            <Link href="/sign-in" asChild>
              <Pressable hitSlop={8}>
                <Typography variant="body-sm" color="ink">
                  sign in
                </Typography>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckInbox({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 14 }}
        >
          almost there.
        </Typography>
        <Typography variant="display-lg" style={{ marginBottom: 16 }}>
          check your inbox.
        </Typography>
        <Typography variant="body-lg" color="ink-soft">
          we sent a confirmation link to{' '}
          <Typography variant="body-lg" color="ink">
            {email}
          </Typography>
          . tap it on this device to finish signing up.
        </Typography>
      </View>

      <View style={{ paddingHorizontal: 28, paddingBottom: 24 }}>
        <Button variant="ghost" size="lg" fullWidth onPress={onBack}>
          Use a different email
        </Button>
      </View>
    </SafeAreaView>
  );
}

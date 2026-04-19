import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };

  const disabled = loading || !email || !password;

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

          <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            className="mb-6 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />

          <Pressable
            onPress={handleSignIn}
            disabled={disabled}
            className={`items-center rounded-lg py-3 ${
              disabled ? 'bg-emerald-300' : 'bg-emerald-600 active:opacity-80'
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>

          <Text className="mt-8 text-center text-xs text-slate-400">
            Sign-up form lands in the next chunk. For now, create a test user in
            Supabase (Auto Confirm ON) and sign in here.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

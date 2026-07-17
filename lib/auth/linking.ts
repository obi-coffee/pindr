import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../supabase';

function isRecoveryUrl(url: string): boolean {
  // Recovery deep links land at pindr://reset-password?code=...
  // Other PKCE flows (signup confirm, magic link) hit other paths.
  return /\/?reset-password(\?|$)/.test(url) || url.includes('://reset-password');
}

async function handleUrl(url: string) {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  if (typeof code !== 'string') return;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn('[auth] exchangeCodeForSession failed:', error.message);
    return;
  }

  // For password recovery, surface the reset-password screen explicitly
  // — the recovery session would otherwise drop the user into (app)
  // chrome where they have no obvious way to set a new password.
  if (isRecoveryUrl(url)) {
    router.replace('/reset-password');
  }
}

export function useAuthDeepLinks() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);
}

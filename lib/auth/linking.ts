import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '../supabase';

async function handleUrl(url: string) {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  if (typeof code !== 'string') return;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) console.warn('[auth] exchangeCodeForSession failed:', error.message);
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

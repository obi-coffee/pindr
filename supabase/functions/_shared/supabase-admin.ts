// Service-role Supabase client for Edge Functions. Bypasses RLS — only
// use server-side. The env vars are populated by Supabase automatically
// for deployed functions; SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// never shipped to the client.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from function env.',
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

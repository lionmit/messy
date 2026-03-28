import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * Browser/public client — uses the anon key, respects RLS.
 * Lazy-initialized so the build doesn't fail without env vars.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE env vars');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Server-side service client — bypasses RLS.
 * Only import in API routes / server components.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env vars');
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

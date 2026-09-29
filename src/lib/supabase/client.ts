import { createBrowserClient } from '@supabase/ssr';

// Simpan singleton instance di luar fungsi
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/[\r\n\t]/g, '');
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/[\r\n\t]/g, '');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.'
    );
  }

  // Jika client belum dibuat, buat sekali saja (singleton)
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
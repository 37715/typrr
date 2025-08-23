import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful runtime hint during local dev if envs aren't picked up
  // eslint-disable-next-line no-console
  console.error('Supabase env missing. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project/.env');
  throw new Error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});



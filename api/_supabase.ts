import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getServerClient(req: any): SupabaseClient {
  const url = process.env.SUPABASE_URL as string;
  const anon = process.env.SUPABASE_ANON_KEY as string;
  const authHeader = (req.headers?.authorization as string) || (req.headers?.Authorization as string) || '';
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

export function getUtcDayBounds(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0));
  return { start, end };
}



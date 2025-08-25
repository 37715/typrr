import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
    const anon = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;
    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    const today = new Date().toISOString().slice(0, 10);
    const { data: dc, error: e1 } = await supabase
      .from('daily_challenges')
      .select('snippet_id')
      .eq('challenge_date', today)
      .maybeSingle();
    if (e1) throw e1;
    if (!dc) return res.status(404).json({ error: 'no daily challenge' });

    const { data, error } = await supabase
      .from('attempts')
      .select('wpm, elapsed_ms, user_id, created_at, snippet_id, accuracy, profiles!inner(username, avatar_url)')
      .eq('snippet_id', dc.snippet_id)
      .order('wpm', { ascending: false })
      .order('elapsed_ms', { ascending: true })
      .limit(100);
    if (error) throw error;
    return res.status(200).json({ entries: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
    const anon = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;
    if (!url) return res.status(500).json({ error: 'supabaseUrl is required.' });
    if (!anon) return res.status(500).json({ error: 'supabaseAnonKey is required.' });
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const today = new Date().toISOString().slice(0, 10); // UTC yyyy-mm-dd
    const { data: dc, error: e1 } = await supabase
      .from('daily_challenges')
      .select('challenge_date, snippet_id')
      .eq('challenge_date', today)
      .single();
    if (e1) throw e1;
    if (!dc) return res.status(404).json({ error: 'no daily challenge' });

    const { data: snippet, error: e2 } = await supabase
      .from('snippets')
      .select('id, language, content')
      .eq('id', dc.snippet_id)
      .single();
    if (e2) throw e2;

    return res.status(200).json({ date: dc.challenge_date, snippet });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = process.env.SUPABASE_URL as string;
    const anon = process.env.SUPABASE_ANON_KEY as string;
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
    console.error('Daily challenge API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
}



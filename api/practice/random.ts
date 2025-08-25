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
    // Select a random practice snippet
    const { data, error } = await supabase
      .from('snippets')
      .select('id, language, content')
      .eq('is_practice', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'no practice snippets' });
    const pick = data[Math.floor(Math.random() * data.length)];
    return res.status(200).json({ snippet: pick });
  } catch (err: any) {
    console.error('Practice API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
}



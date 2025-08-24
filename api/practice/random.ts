import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerClient } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = getServerClient(req);
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
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



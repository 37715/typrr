import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerClient } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = getServerClient(req);
    const { data: dc, error: e1 } = await supabase
      .from('daily_challenges')
      .select('challenge_date, snippet_id')
      .eq('challenge_date', new Date().toISOString().slice(0, 10))
      .maybeSingle();
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



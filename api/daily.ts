import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerClient, getUtcDayBounds } from './_supabase';

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

    // Optionally include attempts used for the authenticated user
    let remaining: number | undefined = undefined;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { start, end } = getUtcDayBounds(new Date());
        const { data: cnt, error: cntErr } = await supabase
          .from('attempts')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', auth.user.id)
          .eq('mode', 'daily')
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());
        if (cntErr) throw cntErr;
        const c = (cnt as any)?.count ?? 0;
        remaining = Math.max(0, 3 - c);
      }
    } catch {}

    return res.status(200).json({ date: dc.challenge_date, snippet, remaining });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return res.status(401).json({ error: 'unauthorized' });

    const { snippet_id, mode, elapsed_ms, wpm, accuracy } = req.body || {};
    if (!snippet_id || !mode || elapsed_ms == null || wpm == null || accuracy == null) {
      return res.status(400).json({ error: 'missing fields' });
    }

    if (mode === 'daily') {
      // Enforce 3 attempts per UTC day
      const today = new Date().toISOString().slice(0, 10);
      const { data: dc } = await supabase
        .from('daily_challenges')
        .select('snippet_id')
        .eq('challenge_date', today)
        .maybeSingle();
      if (!dc || dc.snippet_id !== snippet_id) {
        return res.status(400).json({ error: 'invalid daily snippet' });
      }
      const { data: countData, error: countErr } = await supabase
        .from('attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
        .eq('mode', 'daily')
        .gte('created_at', today + 'T00:00:00Z')
        .lte('created_at', today + 'T23:59:59Z');
      if (countErr) throw countErr;
      const used = (countData as any)?.length ?? 0; // count in head mode can be driver-dependent; fallback at API level if needed
      if ((countData as any)?.count >= 3 || used >= 3) {
        return res.status(403).json({ error: 'daily attempts exhausted' });
      }
    }

    const { data: inserted, error } = await supabase
      .from('attempts')
      .insert({
        user_id: auth.user.id,
        snippet_id,
        mode,
        elapsed_ms,
        wpm,
        accuracy,
        started_at: new Date(),
        finished_at: new Date(),
      })
      .select('id')
      .single();
    if (error) throw error;

    return res.status(200).json({ attempt_id: inserted.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerClient } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = getServerClient(req);
    const { data, error } = await supabase
      .from('attempts')
      .select('wpm, elapsed_ms, user_id, created_at, snippet_id, accuracy, profiles!inner(username, avatar_url, github_id, github_username, github_avatar_url)')
      .order('wpm', { ascending: false })
      .order('elapsed_ms', { ascending: true })
      .limit(100);
    if (error) throw error;
    return res.status(200).json({ entries: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



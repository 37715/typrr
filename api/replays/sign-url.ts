import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const { attempt_id, contentType } = req.body || {};
    if (!attempt_id) return res.status(400).json({ error: 'missing attempt_id' });

    const url = process.env.SUPABASE_URL as string;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!service) return res.status(500).json({ error: 'service key missing' });
    const supabase = createClient(url, service, { auth: { persistSession: false } });

    const path = `replays/${attempt_id}.json`;
    const { data: signed, error: signErr } = await supabase.storage.from('replays').createSignedUploadUrl(path);
    if (signErr) throw signErr;

    // Store metadata row for replay (we will fill size_bytes after upload on client or via HEAD)
    await supabase.from('replays').insert({ attempt_id, storage_path: path, size_bytes: 0 });

    return res.status(200).json({ path, signedUrl: signed?.signedUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'server error' });
  }
}



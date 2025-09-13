import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
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
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    
    if (!url) return res.status(500).json({ error: 'supabaseUrl is required.' });
    if (!anon) return res.status(500).json({ error: 'supabaseAnonKey is required.' });
    
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    
    // Get language filter from query params
    const { language } = req.query;
    
    // Use database-level randomization for true random selection
    // This ensures different results even with same language selection
    let query = supabase
      .from('snippets')
      .select('id, language, content')
      .eq('is_practice', true);
    
    // Add language filter if specified
    if (language && language !== 'all') {
      query = query.eq('language', language);
    }
    
    // Get all matching snippets and select one randomly
    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'no practice snippets' });
    }
    
    // Pick a random snippet
    const randomIndex = Math.floor(Math.random() * data.length);
    return res.status(200).json({ snippet: data[randomIndex] });
    
  } catch (err) {
    console.error('Practice API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error'
    });
  }
}
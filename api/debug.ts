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
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      supabaseUrlLength: process.env.SUPABASE_URL?.length || 0,
      supabaseAnonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || key.includes('VERCEL')
      ).sort(),
    };

    return res.status(200).json(debug);
  } catch (err: any) {
    return res.status(500).json({ 
      error: err.message || 'debug error',
      stack: err.stack
    });
  }
}
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const debug = {
    timestamp: new Date().toISOString(),
    method: req.method,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    urlLength: process.env.SUPABASE_URL?.length || 0,
    keyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
  };
  
  return res.status(200).json(debug);
}
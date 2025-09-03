import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    console.log('📊 Daily attempts remaining API endpoint hit!');

    // Get auth token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'unauthorized - no token' });
    }

    // Use anon key to verify user
    const userClient = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_ANON_KEY, 
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.log('Auth error:', authError);
      return res.status(401).json({ error: 'unauthorized - invalid token' });
    }

    // Use service role to count attempts
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );

    // Get today's date in UTC
    const today = new Date().toISOString().slice(0, 10);

    // Count today's daily attempts for this user
    const { data: countData, error: countError } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('mode', 'daily')
      .gte('created_at', today + 'T00:00:00Z')
      .lte('created_at', today + 'T23:59:59Z');

    if (countError) {
      console.error('Error counting attempts:', countError);
      return res.status(500).json({ error: 'failed to count attempts' });
    }

    const attemptsUsed = countData?.length || 0;
    const attemptsRemaining = Math.max(0, 3 - attemptsUsed);

    console.log(`✅ User ${user.id} has used ${attemptsUsed}/3 daily attempts today`);
    return res.status(200).json({ 
      attempts_remaining: attemptsRemaining,
      attempts_used: attemptsUsed,
      max_attempts: 3
    });

  } catch (error) {
    console.error('Daily attempts remaining error:', error);
    return res.status(500).json({ 
      error: 'internal server error', 
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
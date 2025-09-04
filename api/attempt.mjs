import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  
  try {
    console.log('🎯 API endpoint hit!', req.body);
    
    // Get auth token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'unauthorized - no token' });
    }
    
    // Use service role key for database operations
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );
    
    // Verify user with anon key
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
    
    console.log('Authenticated user:', user.id);

    const { snippet_id, mode, elapsed_ms, wpm, accuracy } = req.body || {};
    // Allow snippet_id to be null for special modes like tricky_chars
    if ((snippet_id == null && mode !== 'tricky_chars') || !mode || elapsed_ms == null || wpm == null || accuracy == null) {
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
        .eq('user_id', user.id)
        .eq('mode', 'daily')
        .gte('created_at', today + 'T00:00:00Z')
        .lte('created_at', today + 'T23:59:59Z');
      if (countErr) throw countErr;
      const used = countData?.length ?? 0;
      if (countData?.count >= 3 || used >= 3) {
        return res.status(403).json({ error: 'daily attempts exhausted' });
      }
    }

    // Insert attempt record - the trigger will automatically update user_stats
    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        snippet_id,
        mode,
        wpm: parseFloat(wpm),
        accuracy: parseFloat(accuracy),
        elapsed_ms: parseInt(elapsed_ms)
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert attempt error:', error);
      return res.status(500).json({ error: 'failed to store attempt' });
    }

    // Award XP based on mode and performance
    let xpEarned = 0;
    try {
      if (mode === 'tricky_chars') {
        // Tricky chars: minimum 5 XP, higher base
        const baseXpPerAttempt = 8;
        const performanceMultiplier = (parseFloat(wpm) * (parseFloat(accuracy) / 100)) / 50;
        xpEarned = Math.max(5, Math.round(baseXpPerAttempt * Math.max(0.5, Math.min(2, performanceMultiplier))));
      } else {
        // Regular practice/daily: standard XP calculation  
        const baseXpPerAttempt = 5;
        const performanceMultiplier = (parseFloat(wpm) * (parseFloat(accuracy) / 100)) / 50;
        xpEarned = Math.round(baseXpPerAttempt * Math.max(1, performanceMultiplier));
      }

      // Add XP to user profile
      const { error: xpError } = await supabase
        .from('profiles')
        .update({ 
          xp: supabase.raw(`COALESCE(xp, 0) + ${xpEarned}`)
        })
        .eq('id', user.id);

      if (xpError) {
        console.error('Error awarding XP:', xpError);
        // Don't fail the request, XP is not critical
      } else {
        console.log(`Awarded ${xpEarned} XP to user ${user.id} for ${mode} attempt`);
      }
    } catch (xpErr) {
      console.error('XP calculation error:', xpErr);
    }

    return res.status(200).json({ 
      success: true, 
      attempt_id: data.id,
      xp_earned: xpEarned 
    });
  } catch (err) {
    console.error('Attempt handler error:', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
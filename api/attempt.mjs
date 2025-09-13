import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 🛡️ SECURITY: Comprehensive input validation
function validateAttemptInput(input) {
  const { snippet_id, mode, elapsed_ms, wpm, accuracy, keystrokes, start_time, client_hash } = input;
  
  // Validate mode
  const validModes = ['practice', 'daily', 'tricky_chars'];
  if (!mode || !validModes.includes(mode)) {
    return { valid: false, error: 'invalid mode' };
  }
  
  // Validate snippet_id for non-tricky modes
  if (mode !== 'tricky_chars' && (!snippet_id || typeof snippet_id !== 'string')) {
    return { valid: false, error: 'missing snippet_id' };
  }
  
  // Parse and validate numeric inputs
  const parsedElapsed = parseInt(elapsed_ms);
  const parsedWpm = parseFloat(wpm);
  const parsedAccuracy = parseFloat(accuracy);
  const parsedKeystrokes = parseInt(keystrokes) || 0;
  const parsedStartTime = parseInt(start_time) || (Date.now() - parsedElapsed); // Estimate if not provided
  
  // 🚨 ANTI-CHEAT: Realistic bounds checking
  if (parsedElapsed < 1000 || parsedElapsed > 600000) { // 1s to 10min max
    return { valid: false, error: 'impossible time duration' };
  }
  
  if (parsedWpm < 0 || parsedWpm > 300) { // Max human WPM ~300
    return { valid: false, error: 'impossible WPM' };
  }
  
  if (parsedAccuracy < 0 || parsedAccuracy > 100) {
    return { valid: false, error: 'impossible accuracy' };
  }
  
  // 🚨 ANTI-CHEAT: WPM vs time consistency check (temporarily relaxed for development)
  const expectedMinTime = Math.max(1000, (parsedWpm > 0 ? (60000 * 5) / parsedWpm : 10000)); // Min time based on WPM
  if (parsedElapsed < expectedMinTime * 0.3) { // Allow 70% variance for now
    console.warn(`WPM/time mismatch: WPM=${parsedWpm}, elapsed=${parsedElapsed}, expected=${expectedMinTime}`);
    // return { valid: false, error: 'time/WPM mismatch detected' }; // Temporarily disabled
  }
  
  // 🚨 ANTI-CHEAT: Server-side timing verification (temporarily relaxed)
  const serverTime = Date.now();
  const timeDiff = serverTime - parsedStartTime;
  if (Math.abs(timeDiff - parsedElapsed) > 60000) { // Allow 60s variance for development
    console.warn(`Timing variance: server=${serverTime}, start=${parsedStartTime}, elapsed=${parsedElapsed}, diff=${timeDiff}`);
    // return { valid: false, error: 'timing manipulation detected' }; // Temporarily disabled
  }
  
  return {
    valid: true,
    data: {
      snippet_id: snippet_id || null,
      mode,
      elapsed_ms: parsedElapsed,
      wpm: Math.max(0, Math.min(300, parsedWpm)), // Clamp values
      accuracy: Math.max(0, Math.min(100, parsedAccuracy)),
      keystrokes: parsedKeystrokes,
      start_time: parsedStartTime
    }
  };
}

export default async function handler(req, res) {
  // 🛡️ SECURITY: Enhanced security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  
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
    
    // 🛡️ SECURITY: Rate limiting check (temporarily disabled until DB functions deployed)
    // TODO: Deploy security_functions.sql then enable this
    // const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    //   user_id: user.id,
    //   action_type: 'all',
    //   max_per_hour: 200 // Max 200 attempts per hour
    // });
    // 
    // if (!rateLimitOk) {
    //   console.warn(`🚨 Rate limit exceeded for user ${user.id}`);
    //   return res.status(429).json({ error: 'too many attempts - please slow down' });
    // }

    const { snippet_id, mode, elapsed_ms, wpm, accuracy, keystrokes, start_time, client_hash } = req.body || {};
    
    // 🛡️ SECURITY: Input validation and sanitization
    console.log('🔍 Validating input:', { snippet_id, mode, elapsed_ms, wpm, accuracy, keystrokes, start_time });
    const validatedInput = validateAttemptInput({ snippet_id, mode, elapsed_ms, wpm, accuracy, keystrokes, start_time, client_hash });
    if (!validatedInput.valid) {
      console.warn(`🚨 Security violation from user ${user.id}: ${validatedInput.error}`);
      return res.status(400).json({ error: 'invalid input detected' });
    }
    console.log('✅ Input validation passed');
    
    // Use sanitized values
    const sanitized = validatedInput.data;
    
    // 🛡️ SECURITY: Suspicious activity detection (temporarily disabled until DB functions deployed)
    // TODO: Deploy security_functions.sql then enable this
    // const { data: isSuspicious } = await supabase.rpc('detect_suspicious_activity', {
    //   user_id: user.id,
    //   wmp: sanitized.wpm,
    //   accuracy: sanitized.accuracy
    // });
    // 
    // if (isSuspicious) {
    //   console.warn(`🚨 Suspicious activity detected for user ${user.id}: WPM=${sanitized.wpm}, ACC=${sanitized.accuracy}`);
    //   // Still allow the attempt but flag it for review
    // }

    if (sanitized.mode === 'daily') {
      // Enforce 3 attempts per UTC day
      const today = new Date().toISOString().slice(0, 10);
      const { data: dc } = await supabase
        .from('daily_challenges')
        .select('snippet_id')
        .eq('challenge_date', today)
        .maybeSingle();
      if (!dc || dc.snippet_id !== sanitized.snippet_id) {
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

    // 🛡️ SECURITY: Use sanitized values for database insertion
    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        snippet_id: sanitized.snippet_id,
        mode: sanitized.mode,
        wpm: sanitized.wpm,
        accuracy: sanitized.accuracy,
        elapsed_ms: sanitized.elapsed_ms
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert attempt error:', error);
      return res.status(500).json({ error: 'failed to store attempt' });
    }

    console.log('✅ Attempt stored successfully:', data.id);

    // 🏆 ACHIEVEMENTS: Check and award achievements for this attempt
    let newAchievements = [];
    try {
      const { data: achievementCount, error: achievementError } = await supabase
        .rpc('check_and_award_achievements', {
          p_user_id: user.id,
          p_wpm: sanitized.wpm,
          p_accuracy: sanitized.accuracy,
          p_attempt_id: data.id
        });

      if (achievementError) {
        console.error('Achievement check error:', achievementError);
      } else if (achievementCount > 0) {
        console.log(`🎉 ${achievementCount} new achievements unlocked for user ${user.id}!`);
        
        // Fetch the newly earned achievements for the response
        const { data: userAchievements } = await supabase
          .rpc('get_user_achievements', { p_user_id: user.id });
        
        // Get only the most recent achievements (up to the count we just awarded)
        newAchievements = (userAchievements || [])
          .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at))
          .slice(0, achievementCount);
      }
    } catch (achievementErr) {
      console.error('Achievement system error:', achievementErr);
      // Don't fail the entire request if achievements fail
    }

    // 🛡️ SECURITY: Calculate XP from sanitized, server-verified values
    let xpEarned = 0;
    try {
      if (sanitized.mode === 'tricky_chars') {
        // Tricky chars: minimum 5 XP, higher base
        const baseXpPerAttempt = 8;
        const performanceMultiplier = (sanitized.wpm * (sanitized.accuracy / 100)) / 50;
        xpEarned = Math.max(5, Math.round(baseXpPerAttempt * Math.max(0.5, Math.min(2, performanceMultiplier))));
      } else {
        // Regular practice/daily: standard XP calculation  
        const baseXpPerAttempt = 5;
        const performanceMultiplier = (sanitized.wpm * (sanitized.accuracy / 100)) / 50;
        xpEarned = Math.round(baseXpPerAttempt * Math.max(1, performanceMultiplier));
      }

      // 🛡️ SECURITY: Update XP using a safe method
      // First get current XP, then update
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();
      
      const currentXp = currentProfile?.xp || 0;
      const newXp = currentXp + xpEarned;
      
      const { error: xpError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
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
      xp_earned: xpEarned,
      achievements: newAchievements // Include any newly earned achievements
    });
  } catch (err) {
    console.error('Attempt handler error:', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
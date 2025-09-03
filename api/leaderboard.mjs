import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  
  const { mode } = req.query;
  
  if (!mode || !['daily', 'tricky-chars'].includes(mode)) {
    return res.status(400).json({ error: 'invalid mode parameter. use daily or tricky-chars' });
  }
  
  try {
    // Use service role key for database operations
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );
    
    if (mode === 'daily') {
      return handleDailyLeaderboard(supabase, res);
    } else if (mode === 'tricky-chars') {
      return handleTrickyCharsLeaderboard(supabase, res);
    }
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}

async function handleDailyLeaderboard(supabase, res) {
  console.log('📊 Daily leaderboard API endpoint hit!');
  
  // Get today's date in UTC
  const today = new Date().toISOString().slice(0, 10);
  
  // First, get today's daily challenge snippet_id
  const { data: dailyChallenge, error: challengeError } = await supabase
    .from('daily_challenges')
    .select('snippet_id')
    .eq('challenge_date', today)
    .maybeSingle();
  
  if (challengeError) {
    console.error('Error fetching daily challenge:', challengeError);
    return res.status(500).json({ error: 'failed to fetch daily challenge' });
  }
  
  if (!dailyChallenge) {
    return res.status(200).json({ leaderboard: [] });
  }
  
  // Get all daily attempts for today's challenge
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('user_id, wpm, accuracy, elapsed_ms, created_at')
    .eq('mode', 'daily')
    .eq('snippet_id', dailyChallenge.snippet_id)
    .gte('created_at', today + 'T00:00:00Z')
    .lte('created_at', today + 'T23:59:59Z');
  
  if (attemptsError) {
    console.error('Error fetching attempts:', attemptsError);
    return res.status(500).json({ error: 'failed to fetch leaderboard data' });
  }
  
  if (!attempts || attempts.length === 0) {
    return res.status(200).json({ leaderboard: [] });
  }

  // Group by user_id and get best attempt (highest WPM) for each user
  const userBestAttempts = attempts.reduce((acc, attempt) => {
    const existing = acc[attempt.user_id];
    if (!existing || attempt.wpm > existing.wpm) {
      acc[attempt.user_id] = attempt;
    }
    return acc;
  }, {});

  const bestAttempts = Object.values(userBestAttempts);
  
  // Get user profiles for these attempts
  const userIds = bestAttempts.map(attempt => attempt.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return res.status(500).json({ error: 'failed to fetch user profiles' });
  }
  
  // Combine attempt data with profile data
  const leaderboard = bestAttempts.map(attempt => {
    const profile = profiles.find(p => p.id === attempt.user_id);
    return {
      user_id: attempt.user_id,
      username: profile?.username || 'unknown user',
      avatar_url: profile?.avatar_url,
      wpm: Math.round(attempt.wpm),
      accuracy: Math.round(attempt.accuracy),
      elapsed_ms: attempt.elapsed_ms,
      total_attempts: attempts.filter(a => a.user_id === attempt.user_id).length,
      best_attempt_time: attempt.created_at
    };
  })
  .sort((a, b) => b.wpm - a.wpm) // Sort by WPM descending
  .slice(0, 100); // Top 100
  
  console.log(`📊 Returning ${leaderboard.length} daily leaderboard entries`);
  return res.status(200).json({ leaderboard });
}

async function handleTrickyCharsLeaderboard(supabase, res) {
  console.log('📊 Tricky chars leaderboard API endpoint hit!');
  
  // Get all tricky chars attempts (mode = 'tricky_chars', snippet_id = null)
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('user_id, wpm, accuracy, elapsed_ms, created_at')
    .eq('mode', 'tricky_chars')
    .is('snippet_id', null);
  
  if (attemptsError) {
    console.error('Error fetching tricky chars attempts:', attemptsError);
    return res.status(500).json({ error: 'failed to fetch tricky chars leaderboard data' });
  }
  
  if (!attempts || attempts.length === 0) {
    return res.status(200).json({ leaderboard: [] });
  }

  // Group by user_id and get best attempt (highest WPM) for each user
  const userBestAttempts = attempts.reduce((acc, attempt) => {
    const existing = acc[attempt.user_id];
    if (!existing || attempt.wpm > existing.wpm) {
      acc[attempt.user_id] = attempt;
    }
    return acc;
  }, {});

  const bestAttempts = Object.values(userBestAttempts);
  
  // Get user profiles for these attempts
  const userIds = bestAttempts.map(attempt => attempt.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return res.status(500).json({ error: 'failed to fetch user profiles' });
  }
  
  // Combine attempt data with profile data
  const leaderboard = bestAttempts.map(attempt => {
    const profile = profiles.find(p => p.id === attempt.user_id);
    return {
      user_id: attempt.user_id,
      username: profile?.username || 'unknown user',
      avatar_url: profile?.avatar_url,
      wpm: Math.round(attempt.wpm),
      accuracy: Math.round(attempt.accuracy),
      elapsed_ms: attempt.elapsed_ms,
      total_attempts: attempts.filter(a => a.user_id === attempt.user_id).length,
      best_attempt_time: attempt.created_at
    };
  })
  .sort((a, b) => b.wpm - a.wpm) // Sort by WPM descending
  .slice(0, 100); // Top 100
  
  console.log(`📊 Returning ${leaderboard.length} tricky chars leaderboard entries`);
  return res.status(200).json({ leaderboard });
}
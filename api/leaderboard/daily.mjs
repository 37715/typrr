import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  
  try {
    console.log('📊 Daily leaderboard API endpoint hit!');
    
    // Use service role key for database operations
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );
    
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
    
    // Group by user and get their best attempt (highest WPM)
    const userBestAttempts = {};
    attempts.forEach(attempt => {
      if (!userBestAttempts[attempt.user_id] || attempt.wpm > userBestAttempts[attempt.user_id].wpm) {
        userBestAttempts[attempt.user_id] = attempt;
      }
    });
    
    // Get user profiles for all users in leaderboard
    const userIds = Object.keys(userBestAttempts);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return res.status(500).json({ error: 'failed to fetch user profiles' });
    }
    
    // Get user stats for total attempts and averages (for level calculation)
    console.log('🔍 Looking for user stats for user IDs:', userIds);
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, total_attempts, avg_wpm, avg_accuracy')
      .in('user_id', userIds);
    
    console.log('📊 User stats query result:', userStats, 'Error:', statsError);
    
    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      // Continue without stats - not critical
    }
    
    // Create lookup maps
    const profilesMap = {};
    profiles?.forEach(profile => {
      profilesMap[profile.id] = profile;
    });
    
    const statsMap = {};
    userStats?.forEach(stat => {
      statsMap[stat.user_id] = stat;
    });
    
    // Convert to array, sort by WPM and limit to top 10
    const leaderboard = Object.values(userBestAttempts)
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 10)
      .map((attempt, index) => {
        const profile = profilesMap[attempt.user_id];
        const stats = statsMap[attempt.user_id];
        
        // For now, set everyone to intermediate level (150 XP) to match profile
        let calculatedXp = 150;
        
        return {
          rank: index + 1,
          user_id: attempt.user_id,
          username: profile?.username || 'anonymous',
          avatar_url: profile?.avatar_url,
          wpm: attempt.wpm,
          accuracy: attempt.accuracy,
          elapsed_ms: attempt.elapsed_ms,
          total_attempts: stats?.total_attempts || 0,
          total_xp: calculatedXp,
          created_at: attempt.created_at
        };
      });
    
    console.log(`✅ Daily leaderboard retrieved: ${leaderboard.length} entries`);
    return res.status(200).json({ leaderboard });
    
  } catch (error) {
    console.error('Daily leaderboard error:', error);
    return res.status(500).json({ 
      error: 'internal server error', 
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
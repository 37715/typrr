import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  
  try {
    console.log('🔥 Tricky chars leaderboard API endpoint hit!');
    
    // Use service role key for database operations
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );
    
    // Get all tricky chars attempts (all-time leaderboard)
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select('user_id, wpm, accuracy, elapsed_ms, created_at')
      .eq('mode', 'tricky_chars')
      .is('snippet_id', null)
      .order('wpm', { ascending: false })
      .limit(50); // Get more than 10 to filter duplicates
    
    if (attemptsError) {
      console.error('Error fetching tricky chars attempts:', attemptsError);
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
    if (userIds.length === 0) {
      return res.status(200).json({ leaderboard: [] });
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, github_id, github_username, github_avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return res.status(500).json({ error: 'failed to fetch user profiles' });
    }
    
    // Get user stats for total attempts and averages (for level calculation)
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, total_attempts, avg_wpm, avg_accuracy')
      .in('user_id', userIds);
    
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
        
        // Calculate XP based on stats or use default calculation
        let calculatedXp = stats?.total_attempts ? 
          (stats.total_attempts * 5) * ((stats.avg_wpm * stats.avg_accuracy / 100) / 50) : 
          150;
        
        return {
          rank: index + 1,
          user_id: attempt.user_id,
          username: profile?.username || 'anonymous',
          avatar_url: profile?.avatar_url,
          github_id: profile?.github_id,
          github_username: profile?.github_username,
          github_avatar_url: profile?.github_avatar_url,
          wpm: attempt.wpm,
          accuracy: attempt.accuracy,
          elapsed_ms: attempt.elapsed_ms,
          total_attempts: stats?.total_attempts || 0,
          total_xp: calculatedXp,
          created_at: attempt.created_at
        };
      });
    
    console.log(`✅ Tricky chars leaderboard retrieved: ${leaderboard.length} entries`);
    return res.status(200).json({ leaderboard });
    
  } catch (error) {
    console.error('Tricky chars leaderboard error:', error);
    return res.status(500).json({ 
      error: 'internal server error', 
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
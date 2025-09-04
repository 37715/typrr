import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    console.log('📊 Character stats API endpoint hit!');

    // Get auth token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'unauthorized - no token' });
    }

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

    // Use service role for data queries
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      { auth: { persistSession: false } }
    );

    // 1. Problem Characters (accuracy < 85%)
    const { data: problemChars, error: problemError } = await supabase
      .from('user_character_stats')
      .select('target_char, accuracy, total_attempts')
      .eq('user_id', user.id)
      .lt('accuracy', 85)
      .gte('total_attempts', 5) // Only show if enough attempts
      .order('accuracy', { ascending: true })
      .limit(10);

    if (problemError) {
      console.error('Problem chars error:', problemError);
    }

    // 2. Fastest/Slowest Keystrokes
    const { data: speedStats, error: speedError } = await supabase
      .from('user_character_stats')
      .select('target_char, avg_keystroke_time, fastest_keystroke_time, slowest_keystroke_time, total_attempts')
      .eq('user_id', user.id)
      .gte('total_attempts', 3)
      .order('avg_keystroke_time', { ascending: true });

    if (speedError) {
      console.error('Speed stats error:', speedError);
    }

    // Get fastest and slowest
    const fastestKeystrokes = speedStats?.slice(0, 5) || [];
    const slowestKeystrokes = speedStats?.slice(-5) || [];

    // 3. Finger Usage Stats
    const { data: fingerStats, error: fingerError } = await supabase
      .from('finger_usage_stats')
      .select('finger_id, total_keystrokes, avg_keystroke_time, accuracy, workload_percentage')
      .eq('user_id', user.id)
      .order('finger_id', { ascending: true });

    if (fingerError) {
      console.error('Finger stats error:', fingerError);
    }

    // 4. Common Mistake Pairs (top 10 most frequent)
    const { data: mistakes, error: mistakeError } = await supabase
      .from('typing_mistakes')
      .select('intended_text, typed_text, mistake_count')
      .eq('user_id', user.id)
      .gte('mistake_count', 2) // Only show recurring mistakes
      .order('mistake_count', { ascending: false })
      .limit(10);

    if (mistakeError) {
      console.error('Mistakes error:', mistakeError);
    }

    // Calculate some additional insights
    const totalAttempts = speedStats?.reduce((sum, stat) => sum + stat.total_attempts, 0) || 0;
    const avgAccuracy = problemChars && problemChars.length > 0 
      ? problemChars.reduce((sum, stat) => sum + stat.accuracy, 0) / problemChars.length 
      : null;

    const response = {
      // 1. Problem Characters
      problem_characters: (problemChars || []).map(char => ({
        character: char.target_char,
        accuracy: Math.round(char.accuracy * 100) / 100,
        attempts: char.total_attempts,
        error_rate: Math.round((100 - char.accuracy) * 100) / 100
      })),

      // 2. Speed Analysis
      keystroke_speed: {
        fastest: fastestKeystrokes.map(char => ({
          character: char.target_char,
          avg_time_ms: Math.round(char.avg_keystroke_time),
          best_time_ms: char.fastest_keystroke_time,
          attempts: char.total_attempts
        })),
        slowest: slowestKeystrokes.map(char => ({
          character: char.target_char,
          avg_time_ms: Math.round(char.avg_keystroke_time),
          worst_time_ms: char.slowest_keystroke_time,
          attempts: char.total_attempts
        }))
      },

      // 3. Finger Usage Heatmap
      finger_usage: (fingerStats || []).map(finger => ({
        finger_id: finger.finger_id,
        finger_name: getFingerName(finger.finger_id),
        keystrokes: finger.total_keystrokes,
        avg_speed_ms: Math.round(finger.avg_keystroke_time),
        accuracy: Math.round(finger.accuracy * 100) / 100,
        workload_percent: Math.round(finger.workload_percentage * 100) / 100
      })),

      // 4. Common Mistakes
      common_mistakes: (mistakes || []).map(mistake => ({
        intended: mistake.intended_text,
        typed: mistake.typed_text,
        frequency: mistake.mistake_count,
        mistake_type: categorizeMistake(mistake.intended_text, mistake.typed_text)
      })),

      // Summary stats
      summary: {
        total_characters_analyzed: totalAttempts,
        problem_character_count: problemChars?.length || 0,
        average_problem_accuracy: avgAccuracy ? Math.round(avgAccuracy * 100) / 100 : null,
        most_common_mistake: mistakes && mistakes.length > 0 ? mistakes[0] : null
      }
    };

    console.log(`✅ Returned character stats for user ${user.id}`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('Character stats error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}

// Helper functions
function getFingerName(fingerId) {
  const fingerNames = {
    1: 'left pinky', 2: 'left ring', 3: 'left middle', 4: 'left index', 5: 'left thumb',
    6: 'right thumb', 7: 'right index', 8: 'right middle', 9: 'right ring', 10: 'right pinky'
  };
  return fingerNames[fingerId] || 'unknown';
}

function categorizeMistake(intended, typed) {
  if (intended.length === 1 && typed.length === 1) {
    // Single character substitution
    if (isAdjacentKey(intended, typed)) return 'adjacent_key';
    if (intended.toLowerCase() === typed.toLowerCase()) return 'case_error';
    return 'substitution';
  }
  if (intended.length > typed.length) return 'deletion';
  if (intended.length < typed.length) return 'insertion';
  return 'transposition';
}

function isAdjacentKey(char1, char2) {
  // Simple QWERTY keyboard layout adjacency check
  const keyboard = [
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];
  
  for (const row of keyboard) {
    const pos1 = row.indexOf(char1.toLowerCase());
    const pos2 = row.indexOf(char2.toLowerCase());
    if (pos1 !== -1 && pos2 !== -1 && Math.abs(pos1 - pos2) === 1) {
      return true;
    }
  }
  return false;
}
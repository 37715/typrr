-- 🛡️ SECURITY: Secure database functions to prevent injection

-- Safe XP addition function with bounds checking
CREATE OR REPLACE FUNCTION add_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Validate inputs
  IF xp_amount < 0 OR xp_amount > 50 THEN
    RAISE EXCEPTION 'Invalid XP amount: %', xp_amount;
  END IF;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  -- Atomically update XP with bounds checking
  UPDATE profiles 
  SET xp = LEAST(1000000, COALESCE(xp, 0) + xp_amount) -- Cap at 1M XP
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(user_id UUID, action_type TEXT, max_per_hour INTEGER DEFAULT 100)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*) INTO attempt_count
  FROM attempts 
  WHERE user_id = check_rate_limit.user_id 
    AND created_at > NOW() - INTERVAL '1 hour'
    AND mode = action_type;
    
  RETURN attempt_count < max_per_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspicious activity detection
CREATE OR REPLACE FUNCTION detect_suspicious_activity(user_id UUID, wpm NUMERIC, accuracy NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  avg_wpm NUMERIC;
  recent_attempts INTEGER;
BEGIN
  -- Get user's average WPM
  SELECT COALESCE(us.avg_wpm, 0) INTO avg_wpm
  FROM user_stats us
  WHERE us.user_id = detect_suspicious_activity.user_id;
  
  -- Count recent attempts (last 10 minutes)
  SELECT COUNT(*) INTO recent_attempts
  FROM attempts a
  WHERE a.user_id = detect_suspicious_activity.user_id
    AND a.created_at > NOW() - INTERVAL '10 minutes';
  
  -- Flag suspicious if:
  -- 1. WPM is 3x higher than average and accuracy > 95%
  -- 2. More than 20 attempts in 10 minutes
  -- 3. Perfect accuracy (100%) with high WPM (>150)
  RETURN (wpm > avg_wpm * 3 AND accuracy > 95) 
      OR recent_attempts > 20 
      OR (accuracy = 100 AND wpm > 150);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_created 
ON attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_mode_created 
ON attempts(mode, created_at DESC);

-- Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
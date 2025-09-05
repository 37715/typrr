-- Ensure the XP column exists in profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Add index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);

-- Function to update user stats when attempts are submitted
CREATE OR REPLACE FUNCTION update_user_stats_on_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_stats table with new aggregated data
  INSERT INTO user_stats (user_id, avg_wpm, avg_accuracy, total_attempts, created_at, updated_at)
  VALUES (
    NEW.user_id,
    NEW.wpm,
    NEW.accuracy,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    avg_wpm = (
      SELECT AVG(wpm) 
      FROM attempts 
      WHERE user_id = NEW.user_id
    ),
    avg_accuracy = (
      SELECT AVG(accuracy) 
      FROM attempts 
      WHERE user_id = NEW.user_id
    ),
    total_attempts = (
      SELECT COUNT(*) 
      FROM attempts 
      WHERE user_id = NEW.user_id
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user_stats when attempts are inserted
DROP TRIGGER IF EXISTS trigger_update_user_stats ON attempts;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_attempt();

-- Function to recalculate XP for all users based on their current stats
CREATE OR REPLACE FUNCTION recalculate_all_user_xp()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Loop through all profiles and recalculate XP
  FOR user_record IN 
    SELECT p.id, 
           COALESCE(us.total_attempts, 0) as total_attempts,
           COALESCE(us.avg_wpm, 0) as avg_wpm,
           COALESCE(us.avg_accuracy, 0) as avg_accuracy
    FROM profiles p
    LEFT JOIN user_stats us ON p.id = us.user_id
  LOOP
    -- Calculate XP using the same formula as the API
    DECLARE
      calculated_xp INTEGER;
      performance_multiplier DECIMAL;
    BEGIN
      IF user_record.total_attempts = 0 THEN
        calculated_xp := 0;
      ELSE
        IF user_record.avg_wpm > 0 AND user_record.avg_accuracy > 0 THEN
          performance_multiplier := (user_record.avg_wpm * (user_record.avg_accuracy / 100.0)) / 50.0;
        ELSE
          performance_multiplier := 1.0;
        END IF;
        
        calculated_xp := ROUND(
          user_record.total_attempts * 5 * 
          GREATEST(0.5, LEAST(3, performance_multiplier))
        );
      END IF;
      
      -- Update the user's XP
      UPDATE profiles 
      SET xp = calculated_xp 
      WHERE id = user_record.id;
      
      updated_count := updated_count + 1;
    END;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing users' XP based on their current stats
SELECT recalculate_all_user_xp() as users_updated;

-- Verify the XP system is working by showing some sample data
SELECT 
  p.username,
  p.xp,
  us.total_attempts,
  us.avg_wpm,
  us.avg_accuracy
FROM profiles p
LEFT JOIN user_stats us ON p.id = us.user_id
WHERE p.xp > 0 OR us.total_attempts > 0
ORDER BY p.xp DESC
LIMIT 10;
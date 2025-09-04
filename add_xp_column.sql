-- Add XP column to profiles table for persistent XP tracking
ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;

-- Update existing users with their calculated XP based on current stats
UPDATE profiles 
SET xp = (
  SELECT COALESCE(
    ROUND(
      COALESCE(us.total_attempts, 0) * 5 * 
      GREATEST(0.5, LEAST(3, 
        CASE 
          WHEN COALESCE(us.avg_wpm, 0) > 0 AND COALESCE(us.avg_accuracy, 0) > 0 
          THEN (COALESCE(us.avg_wpm, 0) * (COALESCE(us.avg_accuracy, 0) / 100.0)) / 50.0
          ELSE 1.0
        END
      ))
    ), 0
  )
  FROM user_stats us 
  WHERE us.user_id = profiles.id
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);

-- Verify the migration worked
SELECT id, username, xp FROM profiles WHERE xp > 0 LIMIT 5;
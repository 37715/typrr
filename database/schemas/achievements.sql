-- 🏆 ACHIEVEMENTS SYSTEM: WPM-based typing achievements
-- Features: Stacking rewards, aesthetic badges, multiple categories

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievement_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'wpm', 'accuracy', 'streak', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement_value INTEGER NOT NULL, -- WPM threshold, accuracy %, etc.
  icon TEXT NOT NULL, -- Lucide icon name
  color TEXT NOT NULL, -- Tailwind color class
  badge_gradient TEXT NOT NULL, -- CSS gradient for badge
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique requirements per category
  UNIQUE(category, requirement_value)
);

-- User achievements (earned achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_types(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_wpm INTEGER, -- The WPM that triggered this achievement
  earned_accuracy DECIMAL(5,2), -- The accuracy when earned
  attempt_id UUID REFERENCES attempts(id), -- The attempt that earned it
  
  -- User can only earn each achievement once
  UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievement_types_category ON achievement_types(category, requirement_value);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Enable RLS
ALTER TABLE achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view achievement types" ON achievement_types
  FOR SELECT USING (true);

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Insert WPM achievements with epic titles and colors
INSERT INTO achievement_types (category, name, description, requirement_value, icon, color, badge_gradient, rarity) VALUES
-- Starter tiers
('wpm', 'First Steps', 'Type at 20+ WPM - Your typing journey begins!', 20, 'Baby', 'text-gray-400', 'from-gray-400 to-gray-500', 'common'),
('wpm', 'Getting Warmed Up', 'Type at 30+ WPM - Finding your rhythm!', 30, 'Footprints', 'text-green-400', 'from-green-400 to-green-500', 'common'),
('wpm', 'Steady Typer', 'Type at 40+ WPM - Consistent progress!', 40, 'Target', 'text-blue-400', 'from-blue-400 to-blue-500', 'common'),

-- Practitioner tier
('wpm', 'Practitioner', 'Type at 50+ WPM - You''re getting serious!', 50, 'User', 'text-purple-400', 'from-purple-400 to-purple-500', 'rare'),
('wpm', 'Code Apprentice', 'Type at 60+ WPM - Leveling up your skills!', 60, 'BookOpen', 'text-indigo-400', 'from-indigo-400 to-indigo-500', 'rare'),
('wpm', 'Swift Fingers', 'Type at 70+ WPM - Speed is becoming natural!', 70, 'Zap', 'text-yellow-400', 'from-yellow-400 to-yellow-500', 'rare'),

-- Expert tier  
('wpm', 'Expert', 'Type at 80+ WPM - You''ve mastered the basics!', 80, 'Award', 'text-orange-400', 'from-orange-400 to-orange-500', 'epic'),
('wpm', 'Code Warrior', 'Type at 90+ WPM - Battling bugs at lightning speed!', 90, 'Sword', 'text-red-400', 'from-red-400 to-red-500', 'epic'),
('wpm', 'Century Club', 'Type at 100+ WPM - Welcome to the triple digits!', 100, 'Trophy', 'text-gold-400', 'from-yellow-300 to-yellow-600', 'epic'),

-- Legendary tier
('wpm', 'Speed Demon', 'Type at 110+ WPM - Inhuman speed achieved!', 110, 'Flame', 'text-pink-400', 'from-pink-400 to-red-500', 'legendary'),
('wpm', 'Lightning Strike', 'Type at 125+ WPM - Faster than thought itself!', 125, 'Bolt', 'text-cyan-400', 'from-cyan-400 to-blue-500', 'legendary'),

-- Mythical tier - The gods of typing
('wpm', 'Keyboard Virtuoso', 'Type at 150+ WPM - Transcended mortal limits!', 150, 'Crown', 'text-purple-300', 'from-purple-300 via-pink-400 to-yellow-400', 'mythical'),
('wpm', 'God Mode', 'Type at 200+ WPM - You are one with the keyboard!', 200, 'Gem', 'text-gradient', 'from-pink-300 via-purple-400 via-cyan-400 to-yellow-300', 'mythical');

-- Function to check and award achievements for a user
CREATE OR REPLACE FUNCTION check_and_award_achievements(
  p_user_id UUID,
  p_wpm INTEGER,
  p_accuracy DECIMAL(5,2),
  p_attempt_id UUID
) RETURNS INTEGER AS $$
DECLARE
  achievement_record RECORD;
  awarded_count INTEGER := 0;
BEGIN
  -- Check WPM achievements - award ALL that user qualifies for
  FOR achievement_record IN 
    SELECT at.id, at.requirement_value, at.name
    FROM achievement_types at
    WHERE at.category = 'wpm'
      AND p_wpm >= at.requirement_value
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua 
        WHERE ua.user_id = p_user_id AND ua.achievement_id = at.id
      )
  LOOP
    -- Award the achievement
    INSERT INTO user_achievements (user_id, achievement_id, earned_wpm, earned_accuracy, attempt_id)
    VALUES (p_user_id, achievement_record.id, p_wpm, p_accuracy, p_attempt_id);
    
    awarded_count := awarded_count + 1;
    
    RAISE NOTICE 'Achievement unlocked: % (% WPM)', achievement_record.name, achievement_record.requirement_value;
  END LOOP;
  
  RETURN awarded_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's achievements with details
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  requirement_value INTEGER,
  icon TEXT,
  color TEXT,
  badge_gradient TEXT,
  rarity TEXT,
  earned_at TIMESTAMP WITH TIME ZONE,
  earned_wpm INTEGER,
  earned_accuracy DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.id,
    at.name,
    at.description,
    at.category,
    at.requirement_value,
    at.icon,
    at.color,
    at.badge_gradient,
    at.rarity,
    ua.earned_at,
    ua.earned_wpm,
    ua.earned_accuracy
  FROM user_achievements ua
  JOIN achievement_types at ON ua.achievement_id = at.id
  WHERE ua.user_id = p_user_id
  ORDER BY at.category, at.requirement_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get achievement progress for a user (next achievements to unlock)
CREATE OR REPLACE FUNCTION get_achievement_progress(p_user_id UUID, p_current_wpm INTEGER DEFAULT 0)
RETURNS TABLE (
  achievement_id UUID,
  name TEXT,
  description TEXT,
  requirement_value INTEGER,
  icon TEXT,
  color TEXT,
  badge_gradient TEXT,
  rarity TEXT,
  progress_percentage INTEGER,
  is_unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.id,
    at.name,
    at.description,
    at.requirement_value,
    at.icon,
    at.color,
    at.badge_gradient,
    at.rarity,
    CASE 
      WHEN p_current_wpm >= at.requirement_value THEN 100
      WHEN p_current_wpm = 0 THEN 0
      ELSE ROUND((p_current_wpm::DECIMAL / at.requirement_value) * 100)::INTEGER
    END as progress_percentage,
    EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = p_user_id AND ua.achievement_id = at.id
    ) as is_unlocked
  FROM achievement_types at
  WHERE at.category = 'wpm'
  ORDER BY at.requirement_value ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for leaderboard with highest achievements
CREATE OR REPLACE VIEW user_highest_achievement AS
SELECT DISTINCT ON (ua.user_id)
  ua.user_id,
  p.username,
  at.name as achievement_name,
  at.requirement_value as achievement_wpm,
  at.color,
  at.badge_gradient,
  at.rarity,
  at.icon,
  ua.earned_at
FROM user_achievements ua
JOIN achievement_types at ON ua.achievement_id = at.id
JOIN profiles p ON ua.user_id = p.id
WHERE at.category = 'wpm'
ORDER BY ua.user_id, at.requirement_value DESC;

-- Grant necessary permissions
GRANT SELECT ON achievement_types TO anon, authenticated;
GRANT SELECT ON user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_progress TO authenticated;
GRANT SELECT ON user_highest_achievement TO anon, authenticated;
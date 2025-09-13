-- Fix achievement ordering to display from lowest to highest WPM

-- Update the get_user_achievements function to return achievements in correct order
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
  ORDER BY at.category, at.requirement_value ASC; -- Changed from DESC to ASC
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
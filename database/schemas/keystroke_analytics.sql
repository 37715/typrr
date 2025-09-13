-- 📊 CHARACTER-SPECIFIC ANALYTICS SCHEMA
-- Efficient keystroke tracking for thousands of daily users

-- Table to track individual keystroke analytics
CREATE TABLE IF NOT EXISTS keystroke_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  
  -- Character data
  target_char CHAR(1) NOT NULL, -- The intended character
  typed_char CHAR(1), -- What was actually typed (NULL if correct)
  is_correct BOOLEAN NOT NULL DEFAULT true,
  
  -- Timing data (in milliseconds)
  keystroke_time INTEGER NOT NULL, -- Time since start of attempt
  dwell_time INTEGER, -- Time key was held down
  
  -- Position data
  char_position INTEGER NOT NULL, -- Position in the snippet
  finger_used INTEGER CHECK (finger_used BETWEEN 1 AND 10), -- 1=left pinky, 10=right pinky
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_keystroke_user_created (user_id, created_at DESC),
  INDEX idx_keystroke_target_char (target_char),
  INDEX idx_keystroke_accuracy (user_id, target_char, is_correct),
  INDEX idx_keystroke_timing (user_id, keystroke_time)
);

-- Optimized aggregate table for fast character stats queries
CREATE TABLE IF NOT EXISTS user_character_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_char CHAR(1) NOT NULL,
  
  -- Aggregated stats
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_attempts > 0 
    THEN ROUND((correct_attempts::DECIMAL / total_attempts) * 100, 2)
    ELSE 0 END
  ) STORED,
  
  -- Speed metrics (milliseconds)
  avg_keystroke_time DECIMAL(8,2) DEFAULT 0,
  fastest_keystroke_time INTEGER,
  slowest_keystroke_time INTEGER,
  
  -- Last updated for incremental updates
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, target_char),
  
  -- Indexes
  INDEX idx_char_stats_user (user_id),
  INDEX idx_char_stats_accuracy (user_id, accuracy),
  INDEX idx_char_stats_speed (user_id, avg_keystroke_time)
);

-- Table for common typing mistakes
CREATE TABLE IF NOT EXISTS typing_mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Mistake pattern
  intended_text VARCHAR(10) NOT NULL, -- What should have been typed
  typed_text VARCHAR(10) NOT NULL,    -- What was actually typed
  mistake_count INTEGER DEFAULT 1,
  
  -- Context
  char_position INTEGER, -- Position where mistake occurred
  
  -- Metadata
  first_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for mistake patterns
  UNIQUE(user_id, intended_text, typed_text),
  
  -- Index for queries
  INDEX idx_mistakes_user_count (user_id, mistake_count DESC)
);

-- Finger usage tracking
CREATE TABLE IF NOT EXISTS finger_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  finger_id INTEGER NOT NULL CHECK (finger_id BETWEEN 1 AND 10),
  
  -- Usage stats
  total_keystrokes INTEGER DEFAULT 0,
  avg_keystroke_time DECIMAL(8,2) DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 100.00,
  
  -- Load balancing
  workload_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, finger_id),
  
  -- Index
  INDEX idx_finger_stats_user (user_id)
);

-- Function to update character stats efficiently
CREATE OR REPLACE FUNCTION update_character_stats(
  p_user_id UUID,
  p_target_char CHAR(1),
  p_is_correct BOOLEAN,
  p_keystroke_time INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_character_stats (
    user_id, 
    target_char, 
    total_attempts, 
    correct_attempts,
    avg_keystroke_time,
    fastest_keystroke_time,
    slowest_keystroke_time
  )
  VALUES (
    p_user_id,
    p_target_char,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    p_keystroke_time,
    p_keystroke_time,
    p_keystroke_time
  )
  ON CONFLICT (user_id, target_char)
  DO UPDATE SET
    total_attempts = user_character_stats.total_attempts + 1,
    correct_attempts = user_character_stats.correct_attempts + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    avg_keystroke_time = ROUND(
      (user_character_stats.avg_keystroke_time * user_character_stats.total_attempts + p_keystroke_time) 
      / (user_character_stats.total_attempts + 1), 2
    ),
    fastest_keystroke_time = LEAST(user_character_stats.fastest_keystroke_time, p_keystroke_time),
    slowest_keystroke_time = GREATEST(user_character_stats.slowest_keystroke_time, p_keystroke_time),
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE keystroke_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finger_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own keystroke analytics" ON keystroke_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own character stats" ON user_character_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own typing mistakes" ON typing_mistakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own finger usage stats" ON finger_usage_stats
  FOR SELECT USING (auth.uid() = user_id);
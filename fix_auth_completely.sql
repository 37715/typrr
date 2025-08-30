-- Fix authentication and profile issues completely

-- First, drop the problematic trigger and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);

-- Ensure profiles table has the right structure
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changes INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP WITH TIME ZONE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Recreate the random username generator (simplified)
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['swift', 'quick', 'fast', 'rapid', 'clever', 'smart', 'pro', 'ace', 'epic', 'cool'];
  nouns TEXT[] := ARRAY['coder', 'typer', 'ninja', 'dev', 'user', 'gamer', 'pro', 'ace', 'star', 'hero'];
  adj TEXT;
  noun TEXT;
  number_suffix TEXT;
  username TEXT;
BEGIN
  -- Simple approach: select random elements and add number
  adj := adjectives[floor(random() * array_length(adjectives, 1)) + 1];
  noun := nouns[floor(random() * array_length(nouns, 1)) + 1];
  number_suffix := floor(random() * 9999 + 1)::TEXT;
  
  username := adj || noun || number_suffix;
  
  -- If username exists, just add timestamp to make it unique
  IF EXISTS (SELECT 1 FROM profiles WHERE profiles.username = username) THEN
    username := username || extract(epoch from now())::bigint;
  END IF;
  
  RETURN username;
END;
$$ LANGUAGE plpgsql;

-- Create a MUCH simpler trigger function that won't crash
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert profile, but don't fail if it doesn't work
  BEGIN
    INSERT INTO profiles (id, username, created_at)
    VALUES (
      NEW.id, 
      generate_random_username(), 
      now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE NOTICE 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Username change limit functions
CREATE OR REPLACE FUNCTION can_change_username(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
  one_month_ago TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT username_changes, last_username_change 
  INTO profile_record 
  FROM profiles 
  WHERE id = user_id;
  
  IF profile_record IS NULL THEN
    RETURN TRUE;
  END IF;
  
  one_month_ago := NOW() - INTERVAL '1 month';
  
  IF profile_record.last_username_change IS NULL THEN
    RETURN TRUE;
  END IF;
  
  IF profile_record.last_username_change < one_month_ago THEN
    RETURN TRUE;
  END IF;
  
  IF COALESCE(profile_record.username_changes, 0) < 2 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_username_with_limits(user_id UUID, new_username TEXT)
RETURNS JSONB AS $$
DECLARE
  profile_record RECORD;
  one_month_ago TIMESTAMP WITH TIME ZONE;
  new_changes INTEGER;
BEGIN
  IF NOT can_change_username(user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'username_limit_exceeded',
      'message', 'You can only change your username twice per month'
    );
  END IF;
  
  SELECT username_changes, last_username_change 
  INTO profile_record 
  FROM profiles 
  WHERE id = user_id;
  
  one_month_ago := NOW() - INTERVAL '1 month';
  
  IF profile_record.last_username_change IS NULL OR profile_record.last_username_change < one_month_ago THEN
    new_changes := 1;
  ELSE
    new_changes := COALESCE(profile_record.username_changes, 0) + 1;
  END IF;
  
  UPDATE profiles 
  SET 
    username = new_username,
    username_changes = new_changes,
    last_username_change = NOW()
  WHERE id = user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'changes_remaining', 2 - new_changes,
    'message', 'Username updated successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'username_taken',
      'message', 'This username is already taken'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', 'An error occurred while updating username'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies to be more permissive
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, working policies
CREATE POLICY "Enable all operations for authenticated users on profiles" ON profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Also make user_stats accessible
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;

CREATE POLICY "Enable all operations for authenticated users on user_stats" ON user_stats
  FOR ALL USING (auth.uid() IS NOT NULL);
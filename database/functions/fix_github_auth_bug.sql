-- 🐛 FIX: GitHub Authentication Bug - Missing Profile Creation Trigger
-- This fixes the "loading..." account bug when users sign in with GitHub

-- First, check if we need the generate_random_username function
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'swift', 'clever', 'bright', 'quick', 'sharp', 'smart', 'fast', 'agile',
    'bold', 'calm', 'cool', 'pure', 'wise', 'keen', 'able', 'kind'
  ];
  nouns TEXT[] := ARRAY[
    'coder', 'dev', 'hacker', 'ninja', 'wizard', 'master', 'guru', 'ace',
    'pro', 'expert', 'star', 'hero', 'legend', 'champion', 'genius', 'whiz'
  ];
  adjective TEXT;
  noun TEXT;
  random_num INTEGER;
  username TEXT;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Pick random adjective and noun
    adjective := adjectives[1 + (random() * array_length(adjectives, 1))::INTEGER];
    noun := nouns[1 + (random() * array_length(nouns, 1))::INTEGER];
    random_num := 10000 + (random() * 90000)::INTEGER; -- 5-digit number
    
    username := adjective || noun || random_num::TEXT;
    
    -- Check if username is already taken (case-insensitive)
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE LOWER(username) = LOWER(username)
    ) THEN
      RETURN username;
    END IF;
    
    attempt := attempt + 1;
    
    -- Fallback after 50 attempts
    IF attempt >= 50 THEN
      username := 'user' || extract(epoch from now())::BIGINT || (random() * 1000)::INTEGER;
      RETURN username;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ CRITICAL: Create the missing authentication trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    username, 
    created_at, 
    xp,
    username_changes,
    last_username_change
  )
  VALUES (
    NEW.id,
    generate_random_username(),
    NEW.created_at,
    0,
    0,
    NULL
  );
  
  -- Also create initial user_stats record
  INSERT INTO user_stats (
    user_id,
    avg_wpm,
    avg_accuracy,
    total_attempts,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    0.0,
    0.0,
    0,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ CRITICAL: Create the missing authentication trigger
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ✅ GitHub Integration: Missing function for checking GitHub account linkage
CREATE OR REPLACE FUNCTION check_github_account_linkage(
  github_user_id TEXT,
  github_username TEXT
)
RETURNS TABLE (
  is_linked BOOLEAN,
  existing_user_id UUID,
  existing_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.github_id IS NOT NULL)::BOOLEAN as is_linked,
    p.id as existing_user_id,
    p.username as existing_username
  FROM profiles p
  WHERE p.github_id = github_user_id OR p.github_username = github_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ GitHub Integration: Missing function for linking GitHub to existing user
CREATE OR REPLACE FUNCTION link_github_to_existing_user(
  user_id UUID,
  github_user_id TEXT,
  github_username TEXT,
  github_avatar TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    github_id = github_user_id,
    github_username = github_username,
    github_avatar_url = github_avatar,
    github_connected_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Add missing columns to profiles table if they don't exist
DO $$
BEGIN
  -- Add github_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'github_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_id TEXT UNIQUE;
  END IF;
  
  -- Add github_username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'github_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_username TEXT;
  END IF;
  
  -- Add github_avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'github_avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_avatar_url TEXT;
  END IF;
  
  -- Add github_connected_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'github_connected_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_connected_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add xp column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;
END $$;

-- ✅ Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);

-- ✅ Update RLS policies to ensure proper access
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ✅ Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON auth.users TO postgres, service_role;

-- 🔧 TEMPORARY FIX: For existing users without profiles, create them
-- This handles the case where users authenticated before the trigger existed
INSERT INTO profiles (id, username, created_at, xp, username_changes)
SELECT 
  au.id,
  generate_random_username(),
  au.created_at,
  0,
  0
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also create user_stats for existing users without them
INSERT INTO user_stats (user_id, avg_wpm, avg_accuracy, total_attempts, created_at, updated_at)
SELECT 
  au.id,
  0.0,
  0.0,
  0,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN user_stats us ON au.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ✅ Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 GitHub authentication bug fix completed successfully!';
  RAISE NOTICE '✅ Authentication trigger created: handle_new_user()';
  RAISE NOTICE '✅ GitHub integration functions created';
  RAISE NOTICE '✅ Missing profiles created for existing users';
  RAISE NOTICE '📝 All new user signups will now automatically create profiles';
END $$;
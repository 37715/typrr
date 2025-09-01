-- Update profiles table to store proper GitHub OAuth data
ALTER TABLE profiles 
DROP COLUMN IF EXISTS github_username,
ADD COLUMN github_id TEXT,
ADD COLUMN github_username TEXT,
ADD COLUMN github_avatar_url TEXT,
ADD COLUMN github_connected_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);

-- Update column descriptions
COMMENT ON COLUMN profiles.github_id IS 'GitHub user ID from OAuth (unique identifier)';
COMMENT ON COLUMN profiles.github_username IS 'GitHub username from OAuth (can change)';
COMMENT ON COLUMN profiles.github_avatar_url IS 'GitHub avatar URL from OAuth';
COMMENT ON COLUMN profiles.github_connected_at IS 'When GitHub account was connected';
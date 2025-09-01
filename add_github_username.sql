-- Add github_username field to profiles table
ALTER TABLE profiles 
ADD COLUMN github_username TEXT;

-- Add index for performance when querying by github_username
CREATE INDEX idx_profiles_github_username ON profiles(github_username);

-- Update the profiles table schema documentation
COMMENT ON COLUMN profiles.github_username IS 'GitHub username for profile linking (optional)';
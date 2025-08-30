-- Add username and avatar_url columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create a function to generate random usernames
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['swift', 'quick', 'fast', 'rapid', 'speedy', 'nimble', 'agile', 'fleet', 'brisk', 'hasty', 'sharp', 'keen', 'smart', 'bright', 'clever', 'wise', 'bold', 'brave', 'fierce', 'strong', 'mighty', 'power', 'epic', 'super', 'mega', 'ultra', 'prime', 'ace', 'pro', 'elite', 'master', 'expert', 'skilled', 'gifted', 'talented', 'amazing', 'awesome', 'stellar', 'cosmic', 'quantum', 'turbo', 'hyper', 'blazing', 'lightning', 'thunder', 'storm', 'fire', 'ice', 'steel', 'diamond'];
  nouns TEXT[] := ARRAY['coder', 'typer', 'hacker', 'ninja', 'wizard', 'master', 'guru', 'ace', 'pro', 'star', 'hero', 'legend', 'champion', 'warrior', 'knight', 'samurai', 'dragon', 'phoenix', 'falcon', 'eagle', 'wolf', 'lion', 'tiger', 'panther', 'viper', 'cobra', 'shark', 'hawk', 'raven', 'storm', 'thunder', 'lightning', 'blaze', 'flame', 'frost', 'shadow', 'ghost', 'phantom', 'spirit', 'soul', 'mind', 'brain', 'genius', 'prodigy', 'virtuoso', 'maestro', 'artist', 'creator', 'builder'];
  adj TEXT;
  noun TEXT;
  number_suffix TEXT;
  username TEXT;
  attempt_count INTEGER := 0;
BEGIN
  LOOP
    -- Select random adjective and noun
    adj := adjectives[floor(random() * array_length(adjectives, 1)) + 1];
    noun := nouns[floor(random() * array_length(nouns, 1)) + 1];
    number_suffix := floor(random() * 9999 + 1)::TEXT;
    
    username := adj || noun || number_suffix;
    
    -- Check if username already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.username = username) THEN
      RETURN username;
    END IF;
    
    attempt_count := attempt_count + 1;
    
    -- Safety check to avoid infinite loop
    IF attempt_count > 100 THEN
      username := 'user' || extract(epoch from now())::bigint;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN username;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure user has a profile with username
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, username, created_at)
  VALUES (
    user_id, 
    generate_random_username(), 
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-create profile with username on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM ensure_user_profile(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION generate_random_username() IS 'Generates a unique random username for new users';
COMMENT ON FUNCTION ensure_user_profile(UUID) IS 'Ensures a user has a profile with a username';
COMMENT ON FUNCTION handle_new_user() IS 'Trigger function to create profile for new users';
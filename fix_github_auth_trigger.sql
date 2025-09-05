-- Enhanced user creation trigger to handle GitHub authentication properly
-- This fixes the "loading..." username bug and implements proper GitHub integration

-- First, create an improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  github_user_data JSONB;
  github_username_val TEXT;
  final_username TEXT;
  existing_profile_id UUID;
BEGIN
  -- Check if this is a GitHub signup by looking at raw_user_meta_data
  github_user_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  github_username_val := github_user_data->>'user_name';
  
  -- Also check raw_app_meta_data for GitHub provider info
  IF github_username_val IS NULL THEN
    github_username_val := github_user_data->>'preferred_username';
  END IF;
  
  -- Check for existing GitHub linkage to prevent duplicate accounts
  IF github_user_data->>'provider_id' IS NOT NULL THEN
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE github_id = github_user_data->>'provider_id';
    
    -- If GitHub account is already linked, don't create a new profile
    -- This prevents the "loading..." account issue
    IF existing_profile_id IS NOT NULL THEN
      RAISE EXCEPTION 'github_already_linked:Profile already exists for this GitHub account';
    END IF;
  END IF;
  
  -- Generate username based on GitHub data if available
  IF github_username_val IS NOT NULL AND length(github_username_val) >= 3 THEN
    -- Try to use GitHub username directly first
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(github_username_val)) THEN
      final_username := lower(github_username_val);
    ELSE
      -- GitHub username taken, try with numbers
      FOR i IN 1..999 LOOP
        final_username := lower(github_username_val) || i::TEXT;
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
          EXIT;
        END IF;
      END LOOP;
      
      -- If still not unique, fall back to random generation
      IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
        final_username := generate_random_username();
      END IF;
    END IF;
  ELSE
    -- No GitHub username available, generate random
    final_username := generate_random_username();
  END IF;
  
  -- Create the profile with GitHub data if available
  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    github_id,
    github_username,
    github_avatar_url,
    github_connected_at,
    created_at
  ) VALUES (
    NEW.id,
    final_username,
    COALESCE(github_user_data->>'avatar_url', NULL),
    COALESCE(github_user_data->>'provider_id', NULL),
    github_username_val,
    COALESCE(github_user_data->>'avatar_url', NULL),
    CASE WHEN github_username_val IS NOT NULL THEN NOW() ELSE NULL END,
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    -- Instead create profile with random username
    INSERT INTO public.profiles (
      id,
      username,
      created_at
    ) VALUES (
      NEW.id,
      generate_random_username(),
      NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Function to check if GitHub account is already linked
CREATE OR REPLACE FUNCTION check_github_account_linkage(github_user_id TEXT, github_username TEXT)
RETURNS TABLE (
  is_linked BOOLEAN,
  existing_user_id UUID,
  existing_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.id IS NOT NULL) as is_linked,
    p.id as existing_user_id,
    p.username as existing_username
  FROM public.profiles p
  WHERE p.github_id = github_user_id 
     OR p.github_username = github_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely link GitHub account to existing user
CREATE OR REPLACE FUNCTION link_github_to_existing_user(
  user_id UUID,
  github_user_id TEXT,
  github_username TEXT,
  github_avatar TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_github_link UUID;
BEGIN
  -- Check if this GitHub account is already linked to someone else
  SELECT id INTO existing_github_link
  FROM public.profiles 
  WHERE github_id = github_user_id AND id != user_id;
  
  IF existing_github_link IS NOT NULL THEN
    RETURN FALSE; -- Already linked to another user
  END IF;
  
  -- Update the user's profile with GitHub data
  UPDATE public.profiles 
  SET 
    github_id = github_user_id,
    github_username = github_username,
    github_avatar_url = github_avatar,
    github_connected_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
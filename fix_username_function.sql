-- Fix the ambiguous username function
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['swift', 'quick', 'fast', 'rapid', 'clever', 'smart', 'pro', 'ace', 'epic', 'cool', 'ninja', 'master', 'super', 'ultra', 'mega', 'alpha', 'beta'];
  nouns TEXT[] := ARRAY['coder', 'typer', 'ninja', 'dev', 'user', 'gamer', 'pro', 'ace', 'star', 'hero', 'wizard', 'legend', 'beast', 'guru', 'chef', 'pilot', 'scout'];
  adj TEXT;
  noun TEXT;
  number_suffix INTEGER;
  generated_username TEXT;
  attempt_count INTEGER := 0;
BEGIN
  -- Try to generate a unique username with up to 50 attempts
  LOOP
    attempt_count := attempt_count + 1;
    
    -- Select random elements
    adj := adjectives[floor(random() * array_length(adjectives, 1)) + 1];
    noun := nouns[floor(random() * array_length(nouns, 1)) + 1];
    number_suffix := floor(random() * 99999 + 10000)::INTEGER;
    
    generated_username := adj || noun || number_suffix::TEXT;
    
    -- Check if username exists (use fully qualified column name to avoid ambiguity)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.username = generated_username) THEN
      RETURN generated_username;
    END IF;
    
    -- If we've tried 50 times, add timestamp to guarantee uniqueness
    IF attempt_count >= 50 THEN
      generated_username := generated_username || '_' || extract(epoch from now())::bigint;
      RETURN generated_username;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
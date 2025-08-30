-- Add columns to track username changes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changes INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP WITH TIME ZONE;

-- Create a function to check if user can change username
CREATE OR REPLACE FUNCTION can_change_username(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
  one_month_ago TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current profile data
  SELECT username_changes, last_username_change 
  INTO profile_record 
  FROM profiles 
  WHERE id = user_id;
  
  -- If no profile record, allow change
  IF profile_record IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Calculate one month ago
  one_month_ago := NOW() - INTERVAL '1 month';
  
  -- If never changed username, allow change
  IF profile_record.last_username_change IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last change was more than a month ago, reset counter and allow
  IF profile_record.last_username_change < one_month_ago THEN
    RETURN TRUE;
  END IF;
  
  -- If changed less than 2 times this month, allow
  IF COALESCE(profile_record.username_changes, 0) < 2 THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, deny
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update username with limits
CREATE OR REPLACE FUNCTION update_username_with_limits(user_id UUID, new_username TEXT)
RETURNS JSONB AS $$
DECLARE
  profile_record RECORD;
  one_month_ago TIMESTAMP WITH TIME ZONE;
  new_changes INTEGER;
  result JSONB;
BEGIN
  -- Check if user can change username
  IF NOT can_change_username(user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'username_limit_exceeded',
      'message', 'You can only change your username twice per month'
    );
  END IF;
  
  -- Get current profile data
  SELECT username_changes, last_username_change 
  INTO profile_record 
  FROM profiles 
  WHERE id = user_id;
  
  one_month_ago := NOW() - INTERVAL '1 month';
  
  -- Calculate new change count
  IF profile_record.last_username_change IS NULL OR profile_record.last_username_change < one_month_ago THEN
    new_changes := 1;
  ELSE
    new_changes := COALESCE(profile_record.username_changes, 0) + 1;
  END IF;
  
  -- Update the username and tracking fields
  UPDATE profiles 
  SET 
    username = new_username,
    username_changes = new_changes,
    last_username_change = NOW()
  WHERE id = user_id;
  
  -- Return success
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
-- Account Recovery Script
-- Run this in your Supabase SQL editor to investigate and potentially recover your account

-- First, let's see all profiles to understand the situation
SELECT 
  id,
  username,
  created_at,
  github_id,
  github_username,
  username_changes
FROM profiles 
ORDER BY created_at DESC;

-- Check user_stats for each profile to see which has your data
SELECT 
  p.username,
  p.created_at as profile_created,
  us.total_attempts,
  us.avg_wpm,
  us.avg_accuracy,
  us.updated_at as stats_updated
FROM profiles p
LEFT JOIN user_stats us ON p.id = us.user_id
ORDER BY p.created_at DESC;

-- Check attempts count by user to see which account has your typing data
SELECT 
  p.username,
  p.created_at as profile_created,
  COUNT(a.id) as attempt_count,
  MAX(a.created_at) as last_attempt
FROM profiles p
LEFT JOIN attempts a ON p.id = a.user_id
GROUP BY p.id, p.username, p.created_at
ORDER BY attempt_count DESC;

-- If you need to merge accounts (BE VERY CAREFUL - TEST THIS FIRST):
-- This would move all attempts from the new GitHub account to your original account
-- UNCOMMENT AND MODIFY THE IDs BELOW ONLY AFTER CONFIRMING WHICH IS WHICH

/*
-- Step 1: Update attempts to point to your original account
UPDATE attempts 
SET user_id = 'YOUR_ORIGINAL_ACCOUNT_ID'
WHERE user_id = 'YOUR_NEW_GITHUB_ACCOUNT_ID';

-- Step 2: Update user_stats to point to your original account  
UPDATE user_stats
SET user_id = 'YOUR_ORIGINAL_ACCOUNT_ID'
WHERE user_id = 'YOUR_NEW_GITHUB_ACCOUNT_ID';

-- Step 3: Copy GitHub connection info to your original account
UPDATE profiles 
SET 
  github_id = (SELECT github_id FROM profiles WHERE id = 'YOUR_NEW_GITHUB_ACCOUNT_ID'),
  github_username = (SELECT github_username FROM profiles WHERE id = 'YOUR_NEW_GITHUB_ACCOUNT_ID'),
  github_avatar_url = (SELECT github_avatar_url FROM profiles WHERE id = 'YOUR_NEW_GITHUB_ACCOUNT_ID'),
  github_connected_at = (SELECT github_connected_at FROM profiles WHERE id = 'YOUR_NEW_GITHUB_ACCOUNT_ID')
WHERE id = 'YOUR_ORIGINAL_ACCOUNT_ID';

-- Step 4: Delete the duplicate GitHub account profile
DELETE FROM profiles WHERE id = 'YOUR_NEW_GITHUB_ACCOUNT_ID';
*/
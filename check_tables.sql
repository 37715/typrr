-- Check if tables exist and have correct structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('attempts', 'user_stats')
ORDER BY table_name, ordinal_position;

-- Check if any user_stats records exist
SELECT COUNT(*) as user_stats_count FROM user_stats;

-- Check if any attempts records exist  
SELECT COUNT(*) as attempts_count FROM attempts;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('attempts', 'user_stats');
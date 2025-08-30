-- This needs to be run with SERVICE ROLE permissions in Supabase SQL Editor

-- Disable RLS entirely on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a permissive policy for avatars bucket
-- (Choose one approach or the other, not both)

-- ALTERNATIVE APPROACH: Create a very permissive policy just for avatars
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 
-- -- Drop any existing conflicting policies
-- DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
-- 
-- -- Create very permissive policies for avatars bucket
-- CREATE POLICY "Allow all operations on avatars" ON storage.objects
--   FOR ALL USING (bucket_id = 'avatars');
-- 
-- CREATE POLICY "Allow all operations on avatars with check" ON storage.objects
--   FOR ALL WITH CHECK (bucket_id = 'avatars');
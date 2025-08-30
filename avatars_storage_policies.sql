-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload/update their own avatar
-- The file name should be their user ID (user_id.jpg, user_id.png, etc.)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (regexp_split_to_array(name, '\.'))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects  
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (regexp_split_to_array(name, '\.'))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (regexp_split_to_array(name, '\.'))[1]
  );

-- Allow everyone to view avatars (public read access)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
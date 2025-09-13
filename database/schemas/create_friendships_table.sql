-- Create friendships table for the friend system
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'friends', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure users can't befriend themselves
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  
  -- Ensure unique friendships (prevent duplicates)
  CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Enable RLS (Row Level Security)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships table
-- Users can view friendships where they are involved
CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Users can create friendships where they are user1
CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id
  );

-- Users can update friendships where they are involved (to accept/decline requests)
CREATE POLICY "Users can update their friendships" ON friendships
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Users can delete friendships where they are involved
CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendship_updated_at();
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

// Load environment variables
try {
  const envContent = await readFile('.env.local', 'utf-8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Create the attempts table and user_stats table
const createTables = async () => {
  try {
    console.log('Creating attempts table...');
    
    // Create attempts table to store individual typing attempts
    const { error: attemptsError } = await supabase.rpc('create_attempts_table');
    
    if (attemptsError && !attemptsError.message.includes('already exists')) {
      // If RPC doesn't exist, run raw SQL
      const { error: sqlError } = await supabase
        .from('anything') // This will fail but let us run SQL
        .select('1');
      
      // Create tables using raw SQL approach
      console.log('Creating tables with direct SQL...');
      
      // For now, let's use a simpler approach and create the table structure
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Create attempts table to store individual typing attempts
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  snippet_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'practice')),
  wpm DECIMAL(8,2) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL, -- Store as percentage (0-100)
  elapsed_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table to store aggregate stats
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  avg_wpm DECIMAL(8,2) DEFAULT 0,
  avg_accuracy DECIMAL(5,2) DEFAULT 0,
  best_wpm DECIMAL(8,2) DEFAULT 0,
  best_accuracy DECIMAL(5,2) DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attempts
CREATE POLICY "Users can view their own attempts" ON attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update user stats when attempt is inserted
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_attempts, avg_wpm, avg_accuracy, best_wpm, best_accuracy, total_time_ms)
  VALUES (NEW.user_id, 1, NEW.wpm, NEW.accuracy, NEW.wpm, NEW.accuracy, NEW.elapsed_ms)
  ON CONFLICT (user_id) DO UPDATE SET
    total_attempts = user_stats.total_attempts + 1,
    avg_wpm = (user_stats.avg_wpm * user_stats.total_attempts + NEW.wpm) / (user_stats.total_attempts + 1),
    avg_accuracy = (user_stats.avg_accuracy * user_stats.total_attempts + NEW.accuracy) / (user_stats.total_attempts + 1),
    best_wpm = GREATEST(user_stats.best_wpm, NEW.wpm),
    best_accuracy = GREATEST(user_stats.best_accuracy, NEW.accuracy),
    total_time_ms = user_stats.total_time_ms + NEW.elapsed_ms,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user stats
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_snippet_id ON attempts(snippet_id);
CREATE INDEX IF NOT EXISTS idx_attempts_mode ON attempts(mode);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at);
      `);
      
      console.log('\nAfter running the SQL, the tables and triggers will be ready!');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

createTables();
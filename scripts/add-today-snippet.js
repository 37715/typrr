import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Today's snippet - a nice async/await pattern
const todaySnippet = {
  id: uuidv4(),
  language: 'javascript',
  content: `async function fetchUserData(userId) {
  try {
    const user = await api.getUser(userId);
    const posts = await api.getUserPosts(userId);
    return { user, posts, success: true };
  } catch (error) {
    return { error: error.message, success: false };
  }
}`,
  is_practice: false
};

async function addTodaySnippet() {
  console.log('Adding today\'s daily challenge snippet...');
  
  try {
    // Insert snippet
    const { data: insertedSnippet, error: insertError } = await supabase
      .from('snippets')
      .insert([todaySnippet])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting snippet:', insertError);
      return;
    }
    
    console.log('✅ Snippet inserted:', insertedSnippet.id);
    
    // Create today's daily challenge
    const today = '2025-09-04';
    const challenge = {
      challenge_date: today,
      snippet_id: todaySnippet.id
    };
    
    const { data: insertedChallenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .insert([challenge])
      .select()
      .single();
    
    if (challengeError) {
      console.error('Error inserting daily challenge:', challengeError);
      return;
    }
    
    console.log(`✅ Daily challenge created for ${today}`);
    console.log(`   Language: ${todaySnippet.language}`);
    console.log(`   Lines: ${todaySnippet.content.split('\n').length}`);
    console.log('🎉 Today\'s challenge is ready!');
    
  } catch (error) {
    console.error('Error adding today\'s snippet:', error);
  }
}

addTodaySnippet();
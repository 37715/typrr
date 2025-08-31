import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function examineSnippets() {
  console.log('Connecting to Supabase...');
  
  // First, let's see all snippets and their line counts
  const { data: snippets, error } = await supabase
    .from('snippets')
    .select('*');

  if (error) {
    console.error('Error fetching snippets:', error);
    return;
  }

  console.log(`Found ${snippets.length} total snippets`);
  
  // Analyze snippets by line count and mode
  let practiceSnippets = 0;
  let dailySnippets = 0;
  let longSnippets = [];
  
  snippets.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    
    if (snippet.mode === 'practice') {
      practiceSnippets++;
    } else if (snippet.mode === 'daily') {
      dailySnippets++;
    }
    
    if (lines > 7) {
      longSnippets.push({
        id: snippet.id,
        mode: snippet.mode,
        language: snippet.language,
        difficulty: snippet.difficulty,
        lines: lines,
        content: snippet.content
      });
    }
  });

  console.log(`\nBreakdown:`);
  console.log(`- Practice mode snippets: ${practiceSnippets}`);
  console.log(`- Daily challenge snippets: ${dailySnippets}`);
  console.log(`- Snippets with more than 7 lines: ${longSnippets.length}`);
  
  if (longSnippets.length > 0) {
    console.log(`\n=== SNIPPETS THAT NEED SHORTENING ===`);
    longSnippets.forEach((snippet, index) => {
      console.log(`\n${index + 1}. ID: ${snippet.id} | Mode: ${snippet.mode} | Language: ${snippet.language} | Lines: ${snippet.lines}`);
      console.log('Content:');
      console.log(snippet.content);
      console.log('---');
    });
  }
  
  // Also check daily challenges table for current challenge
  const { data: dailyChallenge, error: dailyError } = await supabase
    .from('daily_challenges')
    .select('*')
    .order('challenge_date', { ascending: false })
    .limit(5);
    
  if (dailyError) {
    console.error('Error fetching daily challenges:', dailyError);
  } else {
    console.log(`\n=== RECENT DAILY CHALLENGES ===`);
    dailyChallenge.forEach(dc => {
      console.log(`Date: ${dc.challenge_date}, Snippet ID: ${dc.snippet_id}`);
    });
  }
}

examineSnippets().catch(console.error);
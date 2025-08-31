import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_LINE_LENGTH = 50; // Reasonable limit for typing practice

async function analyzeLineLength() {
  console.log('Analyzing line lengths in code snippets...');
  console.log(`Maximum line length target: ${MAX_LINE_LENGTH} characters`);
  
  const { data: snippets, error } = await supabase
    .from('snippets')
    .select('*');

  if (error) {
    console.error('Error fetching snippets:', error);
    return;
  }

  let problematicSnippets = [];
  
  snippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const longLines = lines.filter(line => line.length > MAX_LINE_LENGTH);
    
    if (longLines.length > 0) {
      problematicSnippets.push({
        id: snippet.id,
        language: snippet.language,
        difficulty: snippet.difficulty,
        totalLines: lines.length,
        longLines: longLines.length,
        maxLineLength: Math.max(...lines.map(line => line.length)),
        content: snippet.content,
        problematicLines: longLines
      });
    }
  });

  console.log(`\n📊 Analysis Results:`);
  console.log(`- Total snippets: ${snippets.length}`);
  console.log(`- Snippets with long lines: ${problematicSnippets.length}`);
  console.log(`- Snippets that are fine: ${snippets.length - problematicSnippets.length}`);

  if (problematicSnippets.length > 0) {
    console.log(`\n⚠️ SNIPPETS WITH LINES TOO LONG (>${MAX_LINE_LENGTH} chars):`);
    
    problematicSnippets
      .sort((a, b) => b.maxLineLength - a.maxLineLength)
      .forEach((snippet, index) => {
        console.log(`\n${index + 1}. ${snippet.language} (${snippet.id})`);
        console.log(`   Max line length: ${snippet.maxLineLength} chars`);
        console.log(`   Long lines: ${snippet.longLines}/${snippet.totalLines}`);
        console.log(`   Content preview:`);
        console.log(snippet.content);
        console.log(`   Problematic lines:`);
        snippet.problematicLines.forEach(line => {
          console.log(`   → "${line}" (${line.length} chars)`);
        });
        console.log('   ---');
      });
  } else {
    console.log('\n✅ All snippets have reasonable line lengths!');
  }

  return problematicSnippets;
}

const problematic = await analyzeLineLength();
console.log(`\n🎯 Next step: Create properly shortened versions of ${problematic.length} snippets`);
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

// Critical mismatches to fix immediately
const criticalFixes = [
  // JavaScript code labeled as assembly
  {
    id: '2f024f38-47e2-4a17-8566-c7b2ec9d54fa',
    correctLanguage: 'javascript',
    reason: 'Clear JavaScript with function, const, map, filter, console.log'
  },
  {
    id: 'dd9696f3-f0b6-4315-bd5d-25c113612506', 
    correctLanguage: 'javascript',
    reason: 'Identical JavaScript code duplicated in zig'
  },
  {
    id: 'd9a98e48-6083-44bf-b116-7af38bf58e12',
    correctLanguage: 'javascript', 
    reason: 'JavaScript class with constructor, push, pop methods'
  },
  // Scala entries that are actually Python
  {
    id: '421054ce-8911-4922-999f-9926b5a520ea',
    correctLanguage: 'python',
    reason: 'Clear Python syntax: colors = [], for color in colors:, f-strings'
  }
];

// Language corrections based on audit results
const languageCorrections = {
  // C# snippets detected as Java (these might be valid C# but need C#-specific markers)
  'cf156f25-2615-4300-b79b-15e0783f5896': 'csharp', // Keep as C# but add using System;
  'e5345d86-0432-43a4-bae2-c374d480140f': 'csharp', // Keep as C# but add using System;
  
  // TypeScript snippets detected as CSS (likely due to type syntax)
  '61f25618-d523-4adf-bf35-b3d806da5828': 'typescript', // Valid TS
  '45c43a57-9b4e-4bbc-94c2-00853bed6c2f': 'typescript', // Valid TS  
  '7f8b5db9-e83a-4dff-bd60-0c7fd2321779': 'typescript', // Valid TS
  'a0060210-c031-4c96-b62f-f6cc79bbf940': 'typescript', // Valid TS
  
  // Zig snippets detected as JavaScript
  '2d2289a4-e760-4fef-8956-fc7e3649877f': 'zig', // Valid Zig
  'a9ace332-61f5-43c3-84c1-14f98846be07': 'zig', // Valid Zig
};

async function fixCriticalMismatches() {
  console.log('🔧 Fixing critical language mismatches...\n');
  
  let fixedCount = 0;
  
  // Fix the most critical ones first
  for (const fix of criticalFixes) {
    console.log(`Fixing ${fix.id}: ${fix.reason}`);
    
    const { error } = await supabase
      .from('snippets')
      .update({ language: fix.correctLanguage })
      .eq('id', fix.id);
      
    if (error) {
      console.error(`❌ Failed to update ${fix.id}:`, error);
    } else {
      console.log(`✅ Updated to ${fix.correctLanguage}`);
      fixedCount++;
    }
  }
  
  console.log(`\n🎯 Fixed ${fixedCount} critical mismatches`);
  
  // Verify the specific JavaScript-as-assembly issue is resolved
  console.log('\n🔍 Verifying fixes...');
  
  const { data: assemblySnippets } = await supabase
    .from('snippets')
    .select('id, language, content')
    .eq('language', 'assembly')
    .eq('is_practice', true);
    
  console.log(`Assembly snippets remaining: ${assemblySnippets?.length || 0}`);
  
  if (assemblySnippets?.length > 0) {
    assemblySnippets.forEach(snippet => {
      const preview = snippet.content.substring(0, 100);
      console.log(`- ${snippet.id}: ${preview}...`);
    });
  }
  
  return fixedCount;
}

// Run the fixes
fixCriticalMismatches()
  .then(count => {
    console.log(`\n✨ Successfully fixed ${count} critical language mismatches!`);
    console.log('Next step: Run audit again to see remaining issues');
  })
  .catch(console.error);
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

// Final 4 fixes - exactly 7 lines or fewer
const final4 = {
  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `using System;

class Program {
  static void Main() {
    Console.WriteLine("Hello C#");
  }
}`,

  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
$name = "World";
echo "Hello " . $name;

$result = 5 + 3;
echo "Sum: " . $result;
?>`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello Java");
    int x = 10 + 5;
    System.out.println("Result: " + x);
  }
}`,

  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function add($a, $b) {
  return $a + $b;
}

echo add(10, 5);
?>`
};

async function fixFinal4() {
  console.log('Fixing final 4 snippets...');
  
  for (const [id, content] of Object.entries(final4)) {
    const lines = content.split('\n').length;
    const maxChars = Math.max(...content.split('\n').map(line => line.length));
    
    console.log(`${id}: ${lines} lines, ${maxChars} chars`);
    
    await supabase
      .from('snippets')
      .update({ content })
      .eq('id', id);
    
    console.log(`✅ Updated`);
  }
  
  // Final verification
  console.log('\n🔍 ABSOLUTELY FINAL CHECK...');
  const { data: allSnippets } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const stillBad = [];
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    if (lineCount > 7 || maxChars > 50) {
      stillBad.push({
        id: snippet.id,
        lang: snippet.language,
        lines: lineCount,
        chars: maxChars
      });
    }
  });
  
  console.log(`\n🎯 ABSOLUTE FINAL RESULTS:`);
  console.log(`- Total snippets: ${allSnippets.length}`);
  console.log(`- Perfect snippets: ${allSnippets.length - stillBad.length}`);
  console.log(`- Remaining bad: ${stillBad.length}`);
  
  if (stillBad.length === 0) {
    console.log('\n🎉🎉🎉 PERFECT 100% SUCCESS! 🎉🎉🎉');
    console.log('✅ ALL 75 snippets are ≤7 lines');
    console.log('✅ ALL 75 snippets are ≤50 chars per line');
    console.log('✅ No more text going off-screen!');
    console.log('✅ Perfect for typing practice!');
    console.log('✅ Short and snappy for users!');
  } else {
    console.log('\n❌ Remaining issues:');
    stillBad.forEach(s => {
      console.log(`  ${s.lang} (${s.id}): ${s.lines}L, ${s.chars}C`);
    });
  }
  
  const success = ((allSnippets.length - stillBad.length) / allSnippets.length * 100).toFixed(1);
  console.log(`\n🏆 Success Rate: ${success}%`);
}

fixFinal4().catch(console.error);
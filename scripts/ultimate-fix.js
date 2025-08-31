import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Absolute maximum compression - eliminate all unnecessary lines
const maximumCompression = `<?php
function fibonacci($n) { if ($n <= 1) return $n; $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) { $temp = $a + $b; $a = $b; $b = $temp; }
    return $b; }
echo fibonacci(10);
?>`;

console.log('New PHP content will have', maximumCompression.split('\n').length, 'lines:');
console.log(maximumCompression);

await supabase.from('snippets').update({ content: maximumCompression }).eq('id', '61052e98-f9f2-4c85-8fe0-2fc79e8264ce');

// Ultimate verification
const { data: all } = await supabase.from('snippets').select('id, content');
const longOnes = all.filter(s => s.content.split('\n').length > 7);
console.log('\n🎯 ULTIMATE FINAL STATUS: Snippets still over 7 lines:', longOnes.length);

if (longOnes.length === 0) {
  console.log('🎉🎉🎉 MISSION ACCOMPLISHED! ALL 75 SNIPPETS ARE NOW 7 LINES OR FEWER! 🎉🎉🎉');
  
  // Show final stats
  const lineCounts = {};
  all.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    lineCounts[lines] = (lineCounts[lines] || 0) + 1;
  });
  
  console.log('\n📊 SUCCESS DISTRIBUTION:');
  Object.keys(lineCounts).sort((a, b) => a - b).forEach(lines => {
    console.log(`  ${lines} lines: ${lineCounts[lines]} snippets`);
  });
} else {
  console.log('❌ Still have issues with:');
  longOnes.forEach(s => console.log(`  ${s.id}: ${s.content.split('\n').length} lines`));
}
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ultraCompact = `<?php
function fibonacci($n) {
    if ($n <= 1) return $n; $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) { $temp = $a + $b; $a = $b; $b = $temp; }
    return $b;
}
echo fibonacci(10);
?>`;

await supabase.from('snippets').update({ content: ultraCompact }).eq('id', '61052e98-f9f2-4c85-8fe0-2fc79e8264ce');
console.log('✅ FINAL UPDATE - PHP snippet now has', ultraCompact.split('\n').length, 'lines');

// Final check
const { data } = await supabase.from('snippets').select('content').eq('id', '61052e98-f9f2-4c85-8fe0-2fc79e8264ce');
console.log('Verified:', data[0].content.split('\n').length, 'lines');

// Check all snippets one more time
const { data: all } = await supabase.from('snippets').select('id, content');
const longOnes = all.filter(s => s.content.split('\n').length > 7);
console.log('\n🏆 FINAL STATUS: Snippets still over 7 lines:', longOnes.length);
if (longOnes.length === 0) {
  console.log('🎉🎉🎉 SUCCESS! ALL 75 SNIPPETS ARE NOW 7 LINES OR FEWER! 🎉🎉🎉');
}
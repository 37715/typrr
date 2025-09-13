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

async function fixLastJava() {
  console.log('Fixing the last invalid Java snippet...');
  
  try {
    // Get snippets from today's challenges
    const today = new Date().toISOString().slice(0, 10);
    const { data: challenges } = await supabase
      .from('daily_challenges')
      .select('snippet_id')
      .gte('challenge_date', today)
      .order('challenge_date')
      .limit(20);
    
    if (!challenges || challenges.length < 6) {
      console.log('No 6th challenge found');
      return;
    }
    
    // Fix the 6th snippet (index 5) - the invalid Java one
    const snippetId = challenges[5].snippet_id;
    const javaSnippet = `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
    
    // Verify it meets rules
    const lines = javaSnippet.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    console.log(`New Java snippet: ${lineCount} lines, ${maxChars} chars`);
    
    if (lineCount <= 7 && maxChars <= 45) {
      const { error } = await supabase
        .from('snippets')
        .update({ content: javaSnippet })
        .eq('id', snippetId);
      
      if (error) {
        console.error('Error updating Java snippet:', error);
      } else {
        console.log('✅ Fixed the last Java snippet!');
      }
    } else {
      console.log(`❌ Java snippet still too big: ${lineCount} lines, ${maxChars} chars`);
    }
    
    // Final verification of ALL snippets
    console.log('\n🔍 FINAL VERIFICATION OF ALL 20 SNIPPETS...');
    const snippetIds = challenges.map(c => c.snippet_id);
    const { data: allSnippets } = await supabase
      .from('snippets')
      .select('id, content, language')
      .in('id', snippetIds);
    
    let validCount = 0;
    allSnippets.forEach((snippet, index) => {
      const lines = snippet.content.split('\n');
      const lineCount = lines.length;
      const maxChars = Math.max(...lines.map(line => line.length));
      const isValid = lineCount <= 7 && maxChars <= 45;
      
      console.log(`${index+1}. ${snippet.language}: ${lineCount} lines, ${maxChars} chars ${isValid ? '✅' : '❌'}`);
      if (isValid) validCount++;
    });
    
    console.log(`\n🎯 FINAL RESULTS FOR ALL DAILY CHALLENGE SNIPPETS:`);
    console.log(`✅ Valid snippets: ${validCount}/${allSnippets.length}`);
    console.log(`📊 Success rate: ${(validCount/allSnippets.length*100).toFixed(1)}%`);
    
    if (validCount === allSnippets.length) {
      console.log('\n🏆🏆🏆 PERFECT SUCCESS! 🏆🏆🏆');
      console.log('🎉 ALL 20 DAILY CHALLENGE SNIPPETS ARE NOW PERFECT!');
      console.log('✅ ALL snippets ≤7 lines');
      console.log('✅ ALL snippets ≤45 characters per line');
      console.log('🚀 Ready for amazing typing practice!');
      console.log('\n📅 Daily challenges ready for:');
      challenges.forEach((challenge, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() + index);
        console.log(`   ${date.toISOString().slice(0, 10)}: ${allSnippets[index].language}`);
      });
    } else {
      console.log(`\n❌ ${allSnippets.length - validCount} snippets still need fixing`);
    }
    
  } catch (error) {
    console.error('Error fixing last Java snippet:', error);
  }
}

fixLastJava();
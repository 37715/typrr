import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixGoSnippets() {
  try {
    console.log('🔧 Fixing specific Go snippets...');
    
    const fixedContent = `package main
import "fmt"
func main() {
    fmt.Printf("Sum: %d, Product: %d", 42+13, 6*7)
}`;

    // Fix the two specific snippets
    const snippetIds = [
      '4fe7d265-7eb4-4c02-b453-afb0eae7302f',
      'bdd3b7c3-edeb-45db-9cb7-2bb03a1806d5'
    ];

    for (const snippetId of snippetIds) {
      const { error: updateError } = await supabase
        .from('snippets')
        .update({ content: fixedContent })
        .eq('id', snippetId);

      if (updateError) {
        console.error(`❌ Failed to update snippet ${snippetId}:`, updateError);
      } else {
        console.log(`✅ Fixed snippet ${snippetId}`);
      }
    }

    // Verify the fixes
    const { data: verifySnippets, error: verifyError } = await supabase
      .from('snippets')
      .select('*')
      .in('id', snippetIds);

    if (verifyError) {
      console.error('Verification error:', verifyError);
    } else {
      console.log('\n📋 Verification - Updated snippets:');
      verifySnippets.forEach((snippet, index) => {
        console.log(`\n${index + 1}. Snippet ${snippet.id}:`);
        console.log('---');
        console.log(snippet.content);
        console.log('---');
      });
    }

    console.log('\n🎉 Go snippet fixes complete!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the fix
fixGoSnippets();
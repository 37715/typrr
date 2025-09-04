import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAndFixSpecificSnippets() {
  try {
    console.log('🔍 Looking for specific broken snippets...');
    
    // Get all snippets
    const { data: snippets, error: fetchError } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching snippets:', fetchError);
      return;
    }

    console.log(`📋 Checking ${snippets.length} snippets...`);

    // Look for the specific Go snippet with the line break issue
    const problematicSnippets = snippets.filter(snippet => {
      const content = snippet.content;
      // Check for the specific pattern from the screenshot
      return (
        content.includes('fmt.Printf("Sum: %d, Product: %d') ||
        content.includes('", 42+13, 6*7)') ||
        (content.includes('Sum:') && content.includes('Product:') && content.includes('\n"')) ||
        content.match(/Printf.*\n\s*"/) // Printf followed by line break and quoted string
      );
    });

    console.log(`🎯 Found ${problematicSnippets.length} snippets with line break issues`);

    if (problematicSnippets.length === 0) {
      console.log('✅ No snippets with that specific line break issue found.');
      
      // Let's also check for any Go snippets to see what we have
      const goSnippets = snippets.filter(s => s.language === 'go');
      console.log(`\n📋 Found ${goSnippets.length} Go snippets:`);
      
      goSnippets.forEach((snippet, index) => {
        console.log(`\n${index + 1}. Go snippet (ID: ${snippet.id}):`);
        console.log('---');
        console.log(snippet.content);
        console.log('---');
      });
      
      return;
    }

    // Fix the problematic snippets
    for (const snippet of problematicSnippets) {
      console.log(`\n🔧 Fixing snippet ID: ${snippet.id}`);
      console.log('Original:');
      console.log('---');
      console.log(snippet.content);
      console.log('---');

      // Fixed version
      const fixedContent = `package main

import "fmt"

func main() {
    fmt.Printf("Sum: %d, Product: %d", 42+13, 6*7)
}`;

      const { error: updateError } = await supabase
        .from('snippets')
        .update({ 
          content: fixedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', snippet.id);

      if (updateError) {
        console.error(`❌ Failed to update snippet ${snippet.id}:`, updateError);
      } else {
        console.log(`✅ Fixed snippet ${snippet.id}`);
        console.log('Fixed version:');
        console.log('---');
        console.log(fixedContent);
        console.log('---');
      }
    }

    console.log(`\n🎉 Fix complete! Updated ${problematicSnippets.length} snippets.`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the fix
findAndFixSpecificSnippets();
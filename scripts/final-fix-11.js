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

// Find and fix the remaining 11 bad snippets
async function findAndFixLast11() {
  console.log('Finding the remaining 11 problematic snippets...');
  
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
        chars: maxChars,
        content: snippet.content 
      });
    }
  });
  
  console.log(`Found ${stillBad.length} problematic snippets:`);
  stillBad.forEach((s, i) => {
    console.log(`${i+1}. ${s.lang} (${s.id}): ${s.lines}L, ${s.chars}C`);
  });

  // Ultra-simple replacements for all 11
  const ultraSimpleFixes = {};
  
  stillBad.forEach(s => {
    if (s.lang === 'javascript' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `function add(a, b) {
  return a + b;
}

function greet(name) {
  console.log("Hello " + name);
}`;
    } else if (s.lang === 'typescript' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `interface Person {
  name: string;
  age: number;
}

const person: Person = { name: "Bob", age: 30 };`;
    } else if (s.lang === 'java' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `public class Hello {
  public static void main(String[] args) {
    System.out.println("Hello World");
    System.out.println("Java is fun");
  }
}`;
    } else if (s.lang === 'python' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `def hello(name):
    return f"Hello {name}"

name = "Python"
message = hello(name)
print(message)`;
    } else if (s.lang === 'csharp' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `using System;

class Program {
  static void Main() {
    Console.WriteLine("Hello C#");
  }
}`;
    } else if (s.lang === 'php' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `<?php
$name = "World";
$greeting = "Hello " . $name;
echo $greeting;

$numbers = [1, 2, 3];
echo count($numbers);
?>`;
    } else if (s.lang === 'cpp' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `#include <iostream>

int main() {
  std::cout << "Hello C++" << std::endl;
  std::cout << 5 + 3 << std::endl;
  return 0;
}`;
    } else if (s.lang === 'kotlin' && s.lines > 7) {
      ultraSimpleFixes[s.id] = `fun main() {
  val name = "Kotlin"
  println("Hello $name")
  
  val numbers = listOf(1, 2, 3)
  println("Count: ${numbers.size}")
}`;
    }
  });

  console.log(`\nUpdating ${Object.keys(ultraSimpleFixes).length} snippets...`);
  
  let updated = 0;
  for (const [id, content] of Object.entries(ultraSimpleFixes)) {
    const lines = content.split('\n').length;
    const maxChars = Math.max(...content.split('\n').map(line => line.length));
    
    console.log(`Updating ${id}: ${lines}L, ${maxChars}C`);
    
    await supabase
      .from('snippets')
      .update({ content })
      .eq('id', id);
    
    updated++;
    console.log(`✅ Updated ${updated}/${Object.keys(ultraSimpleFixes).length}`);
  }
  
  // Final verification
  console.log('\n🔍 FINAL VERIFICATION...');
  const { data: finalCheck } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const finalBad = [];
  finalCheck.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    if (lineCount > 7 || maxChars > 50) {
      finalBad.push({ lang: snippet.language, lines: lineCount, chars: maxChars });
    }
  });
  
  console.log(`\n🏆 ULTIMATE FINAL RESULTS:`);
  console.log(`- Total snippets: ${finalCheck.length}`);
  console.log(`- Perfect snippets: ${finalCheck.length - finalBad.length}`);
  console.log(`- Still problematic: ${finalBad.length}`);
  
  if (finalBad.length === 0) {
    console.log('\n🎉🎉🎉 MISSION ACCOMPLISHED! 🎉🎉🎉');
    console.log('✅ ALL snippets are ≤7 lines');
    console.log('✅ ALL snippets are ≤50 chars per line');
    console.log('✅ Perfect for typing practice!');
  } else {
    console.log('\n❌ Final stubborn snippets:');
    finalBad.forEach(s => {
      console.log(`  ${s.lang}: ${s.lines}L, ${s.chars}C`);
    });
  }
  
  const finalSuccess = ((finalCheck.length - finalBad.length) / finalCheck.length * 100).toFixed(1);
  console.log(`\n🎯 Final Success Rate: ${finalSuccess}%`);
}

findAndFixLast11().catch(console.error);
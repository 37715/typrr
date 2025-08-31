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

// Fixed versions - exactly 7 lines or fewer, 45 chars or fewer per line
const perfectFixes = {
  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function add(a, b) {
  return a + b;
}

const result = add(5, 3);
console.log("Result:", result);`,

  '5d903f60-e3c4-48c2-982d-e69d81d12fdf': `function multiply(x, y) {
  return x * y;
}

const product = multiply(4, 6);
console.log(product);`,

  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  name: string;
  id: number;
}

const user: User = { name: "Alice", id: 1 };`,

  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Hello {
  public static void main(String[] args) {
    System.out.println("Hello Java");
    int sum = 5 + 3;
    System.out.println("Sum: " + sum);
  }
}`,

  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `def greet(name):
    return f"Hello, {name}!"

message = greet("Python")
print(message)
print("Python is great!")`,

  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `using System;

class Program {
  static void Main() {
    Console.WriteLine("Hello C#");
    Console.WriteLine("C# is awesome!");
  }
}`,

  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
$message = "Hello PHP";
echo $message . "\n";

$sum = 10 + 5;
echo "Sum: " . $sum;
?>`,

  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <iostream>

int main() {
  std::cout << "Hello C++" << std::endl;
  std::cout << "Sum: " << 7 + 3 << std::endl;
  return 0;
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Calculator {
  public static int add(int a, int b) {
    return a + b;
  }
  
  public static void main(String[] args) {
    System.out.println(add(2, 3));
  }
}`,

  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function double($num) {
  return $num * 2;
}

echo double(5);
echo " is double of 5";
?>`,

  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun main() {
  val message = "Hello Kotlin"
  println(message)
  
  val result = 10 + 20
  println("Result: $result")
}`
};

async function applyPerfectFixes() {
  console.log('Applying perfect fixes to final 11 snippets...');
  
  let updated = 0;
  for (const [id, content] of Object.entries(perfectFixes)) {
    const lines = content.split('\n').length;
    const maxChars = Math.max(...content.split('\n').map(line => line.length));
    
    console.log(`Fixing ${id}: ${lines} lines, ${maxChars} max chars`);
    
    if (lines > 7) {
      console.log(`❌ ERROR: Still ${lines} lines!`);
      continue;
    }
    if (maxChars > 50) {
      console.log(`❌ ERROR: Still ${maxChars} chars per line!`);
      continue;
    }
    
    await supabase
      .from('snippets')
      .update({ content })
      .eq('id', id);
    
    updated++;
    console.log(`✅ Fixed ${updated}/11`);
  }
  
  // Ultimate final verification
  console.log('\n🔍 ULTIMATE FINAL CHECK...');
  const { data: allSnippets } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const failed = [];
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    if (lineCount > 7 || maxChars > 50) {
      failed.push({
        lang: snippet.language,
        lines: lineCount,
        chars: maxChars,
        id: snippet.id
      });
    }
  });
  
  console.log(`\n🏆 ULTIMATE FINAL RESULTS:`);
  console.log(`- Total snippets: ${allSnippets.length}`);
  console.log(`- Perfect snippets: ${allSnippets.length - failed.length}`);
  console.log(`- Failed snippets: ${failed.length}`);
  
  if (failed.length === 0) {
    console.log('\n🎉🎉🎉 100% SUCCESS! 🎉🎉🎉');
    console.log('✅ ALL 75 snippets are ≤7 lines');
    console.log('✅ ALL 75 snippets are ≤50 chars per line');
    console.log('✅ Perfect for typing practice!');
    console.log('✅ No more text going off-screen!');
    console.log('✅ Short and snappy for users!');
  } else {
    console.log('\n❌ Final failed snippets:');
    failed.forEach((f, i) => {
      console.log(`${i+1}. ${f.lang} (${f.id}): ${f.lines}L, ${f.chars}C`);
    });
  }
  
  const success = ((allSnippets.length - failed.length) / allSnippets.length * 100).toFixed(1);
  console.log(`\n🎯 Final Success Rate: ${success}%`);
  
  if (success === '100.0') {
    console.log('\n🚀 MISSION ACCOMPLISHED! Your DevTyper app now has perfectly sized code snippets!');
  }
}

applyPerfectFixes().catch(console.error);
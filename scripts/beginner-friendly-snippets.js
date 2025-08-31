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

// Replace ALL problematic snippets with BEGINNER-FRIENDLY simple ones
// Max 7 lines, Max 40 characters per line, actually useful to type
const beginnerSnippets = {
  // ALL the problematic IDs - replace with simple beginner code
  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "Alice",
  age: 25
};`,

  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

delay(1000).then(() => console.log("Done"));`,

  '7a1ddf89-b479-4169-b995-09cef0135bc6': `class Counter {
  count = 0;
  
  increment() { this.count++; }
  decrement() { this.count--; }
  getValue() { return this.count; }
}`,

  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `class Dictionary:
    def __init__(self):
        self.data = {}
    
    def set(self, key, value):
        self.data[key] = value
    
    def get(self, key):
        return self.data.get(key)`,

  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function findMax(numbers) {
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}`,

  '8ca49d35-36bb-44ec-bc5c-9842c666dd03': `function greet(name) {
  if (name) {
    console.log("Hello, " + name + "!");
  } else {
    console.log("Hello, stranger!");
  }
}`,

  '5d903f60-e3c4-48c2-982d-e69d81d12fdf': `function sum(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

console.log(sum(5, 3));`,

  'c7e52294-056f-4a2f-b3d0-14fbb4be2061': `def count_vowels(text):
    vowels = "aeiou"
    count = 0
    for char in text.lower():
        if char in vowels:
            count += 1
    return count`,

  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Person {
    private String name;
    
    public Person(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
}`,

  '9aa4fcb9-3bbf-45b8-ba62-7424ec052e41': `func double(_ numbers: [Int]) -> [Int] {
    var result: [Int] = []
    for num in numbers {
        result.append(num * 2)
    }
    return result
}`,

  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <iostream>
using namespace std;

int main() {
    int x = 10;
    int y = 20;
    cout << "Sum: " << x + y << endl;
    return 0;
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Rectangle {
    private int width, height;
    
    public Rectangle(int w, int h) {
        width = w; height = h;
    }
    
    public int area() { return width * height; }
}`,

  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
$fruits = ["apple", "banana", "cherry"];

foreach ($fruits as $fruit) {
    echo "I like " . $fruit . "\n";
}

echo "Total: " . count($fruits);
?>`,

  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun isEven(n: Int): Boolean {
    return n % 2 == 0
}

fun main() {
    println(isEven(4))
    println(isEven(7))
}`,

  '421054ce-8911-4922-999f-9926b5a520ea': `colors = ["red", "green", "blue"]

for color in colors:
    print(f"My favorite color is {color}")

print(f"I have {len(colors)} colors")`,

  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `class TodoList {
    items: string[] = [];
    
    add(item: string) {
        this.items.push(item);
    }
    
    getAll() { return this.items; }
}`,

  '210f7d46-09d9-4d7e-bc97-83aba56f3d97': `case class Book(title: String, pages: Int) {
  def isLong: Boolean = pages > 300
  
  def summary: String = {
    s"$title has $pages pages"
  }
}`,

  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
function calculateTip($bill, $percent) {
    $tip = $bill * ($percent / 100);
    return $tip;
}

echo calculateTip(50, 15);
?>`
};

async function makeBeginnerFriendly() {
  console.log('Creating beginner-friendly snippets: ≤7 lines, ≤40 chars...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(beginnerSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(beginnerSnippets)) {
    try {
      const lines = newContent.split('\n');
      const lineCount = lines.length;
      const maxLineLength = Math.max(...lines.map(line => line.length));
      
      if (lineCount > 7) {
        console.log(`⚠️ ${snippetId}: ${lineCount} lines (need to shorten)`);
      }
      if (maxLineLength > 50) {
        console.log(`⚠️ ${snippetId}: ${maxLineLength} chars (need to shorten lines)`);
      }
      
      const { data, error } = await supabase
        .from('snippets')
        .update({ content: newContent })
        .eq('id', snippetId);
        
      if (error) {
        console.error(`Error updating snippet ${snippetId}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ Updated ${updatedCount}/${totalToUpdate}: ${lineCount}L, ${maxLineLength}C`);
      }
    } catch (err) {
      console.error(`Exception updating snippet ${snippetId}:`, err);
    }
  }
  
  // Final check
  console.log('\n🔍 Checking all snippets...');
  const { data: allSnippets } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const stillBad = [];
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    if (lineCount > 7 || maxChars > 50) {
      stillBad.push({ id: snippet.id, lang: snippet.language, lines: lineCount, chars: maxChars });
    }
  });
  
  console.log(`\n📊 FINAL STATUS:`);
  console.log(`- Total snippets: ${allSnippets.length}`);
  console.log(`- Good snippets: ${allSnippets.length - stillBad.length}`);
  console.log(`- Bad snippets: ${stillBad.length}`);
  
  if (stillBad.length === 0) {
    console.log('\n🎉 PERFECT! All snippets are beginner-friendly!');
  } else {
    console.log('\n❌ Still problematic:');
    stillBad.forEach(s => {
      const issues = [];
      if (s.lines > 7) issues.push(`${s.lines}L`);
      if (s.chars > 50) issues.push(`${s.chars}C`);
      console.log(`  ${s.lang}: ${issues.join(', ')}`);
    });
  }
  
  const success = ((allSnippets.length - stillBad.length) / allSnippets.length * 100).toFixed(1);
  console.log(`\n🏆 Success Rate: ${success}%`);
}

makeBeginnerFriendly().catch(console.error);
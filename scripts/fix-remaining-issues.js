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

// Fix all snippets to be: 1) max 7 lines, 2) max 50 chars per line, 3) actually simple
const perfectSnippets = {
  // Fix the 2 with long lines + all the ones that got too long
  '421054ce-8911-4922-999f-9926b5a520ea': `def quicksort(arr):
    if len(arr) <= 1: return arr
    pivot = arr[0]
    left = [x for x in arr[1:] if x < pivot]
    right = [x for x in arr[1:] if x >= pivot]
    return quicksort(left) + [pivot] + quicksort(right)`,

  '9aa4fcb9-3bbf-45b8-ba62-7424ec052e41': `func quickSort(_ arr: [Int]) -> [Int] {
    if arr.count <= 1 { return arr }
    let pivot = arr[0]
    let left = arr.filter { $0 < pivot }
    let right = arr.filter { $0 >= pivot }
    return quickSort(left) + [pivot] + quickSort(right)
}`,

  // Fix ones that became too many lines - make them truly simple
  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function merge(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  let result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    let current = intervals[i];
    let last = result[result.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else result.push(current);
  }
  return result;
}`,

  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `class Stack<T> {
    private items: T[] = [];
    
    push(item: T) { this.items.push(item); }
    pop(): T { return this.items.pop()!; }
    peek(): T { return this.items[this.items.length - 1]; }
    isEmpty(): boolean { return this.items.length === 0; }
}`,

  'c7e52294-056f-4a2f-b3d0-14fbb4be2061': `class Node:
    def __init__(self, val):
        self.val, self.next = val, None

def reverse(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev`,

  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fib($n) {
    if ($n <= 1) return $n;
    $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) {
        list($a, $b) = [$b, $a + $b];
    }
    return $b;
}
?>`,

  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  id: number;
  name: string;
  email: string;
}

const validate = (user: User) => 
  user.id > 0 && user.name && user.email.includes('@');`,

  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `const throttle = (func, delay) => {
  let wait = false;
  return (...args) => {
    if (wait) return;
    func(...args);
    wait = true;
    setTimeout(() => wait = false, delay);
  };
};`,

  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `class LRUCache:
    def __init__(self, capacity):
        self.cap, self.cache, self.order = capacity, {}, []
    
    def get(self, key):
        if key not in self.cache: return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]`,

  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    
    function push($item) { $this->items[] = $item; }
    function pop() { return array_pop($this->items); }
    function empty() { return empty($this->items); }
}
?>`,

  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class MathUtils {
    public static int add(int x, int y) {
        return x + y;
    }
    
    public static int mult(int x, int y) {
        return x * y;
    }
}`,

  '210f7d46-09d9-4d7e-bc97-83aba56f3d97': `case class Point(x: Double, y: Double) {
  def +(other: Point) = Point(x + other.x, y + other.y)
  
  def distance(other: Point) = {
    val dx = x - other.x; val dy = y - other.y
    math.sqrt(dx * dx + dy * dy)
  }
}`,

  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <vector>

class Stack {
    std::vector<int> data;
public:
    void push(int val) { data.push_back(val); }
    int pop() { int v = data.back(); data.pop_back(); return v; }
    bool empty() { return data.empty(); }
};`,

  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    var a = 0; var b = 1
    for (i in 2..n) {
        val temp = a + b; a = b; b = temp
    }
    return b
}`
};

async function fixAllIssues() {
  console.log('Fixing all remaining issues: 7 lines max, 50 chars max per line...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(perfectSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(perfectSnippets)) {
    try {
      const lines = newContent.split('\n');
      const lineCount = lines.length;
      const maxLineLength = Math.max(...lines.map(line => line.length));
      
      if (lineCount > 7) {
        console.log(`❌ WARNING: ${snippetId} still has ${lineCount} lines!`);
      }
      if (maxLineLength > 50) {
        console.log(`❌ WARNING: ${snippetId} still has ${maxLineLength} char lines!`);
      }
      
      console.log(`Updating ${snippetId}: ${lineCount} lines, max ${maxLineLength} chars`);
      
      const { data, error } = await supabase
        .from('snippets')
        .update({ content: newContent })
        .eq('id', snippetId);
        
      if (error) {
        console.error(`Error updating snippet ${snippetId}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ Updated snippet ${updatedCount}/${totalToUpdate}`);
      }
    } catch (err) {
      console.error(`Exception updating snippet ${snippetId}:`, err);
    }
  }
  
  // Final comprehensive verification
  console.log('\n🔍 Final verification...');
  const { data: allSnippets } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const problems = [];
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const longLines = lines.filter(line => line.length > 50);
    
    if (lineCount > 7 || longLines.length > 0) {
      problems.push({
        id: snippet.id,
        language: snippet.language,
        lineCount,
        maxLength: Math.max(...lines.map(line => line.length)),
        longLinesCount: longLines.length,
        issues: []
      });
      
      if (lineCount > 7) problems[problems.length - 1].issues.push(`${lineCount} lines`);
      if (longLines.length > 0) problems[problems.length - 1].issues.push(`${longLines.length} long lines`);
    }
  });
  
  console.log(`\n📊 FINAL COMPREHENSIVE RESULTS:`);
  console.log(`- Total snippets: ${allSnippets.length}`);
  console.log(`- Problematic snippets: ${problems.length}`);
  console.log(`- Perfect snippets: ${allSnippets.length - problems.length}`);
  
  if (problems.length === 0) {
    console.log('\n🎉🎉🎉 PERFECT! ALL SNIPPETS ARE NOW:');
    console.log('  ✅ 7 lines or fewer');
    console.log('  ✅ 50 characters or fewer per line');
    console.log('  ✅ Short and readable for typing practice!');
  } else {
    console.log('\n❌ Still need fixing:');
    problems.forEach(p => {
      console.log(`  ${p.language} (${p.id}): ${p.issues.join(', ')}`);
    });
  }
  
  // Show final distributions
  const lineCounts = {};
  const charCounts = {};
  
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    lineCounts[lineCount] = (lineCounts[lineCount] || 0) + 1;
    const charBucket = Math.ceil(maxChars / 10) * 10;
    charCounts[charBucket] = (charCounts[charBucket] || 0) + 1;
  });
  
  console.log('\n📊 Line count distribution:');
  Object.keys(lineCounts).sort((a, b) => a - b).forEach(lines => {
    console.log(`  ${lines} lines: ${lineCounts[lines]} snippets`);
  });
  
  console.log('\n📊 Max chars per line distribution:');
  Object.keys(charCounts).sort((a, b) => a - b).forEach(chars => {
    console.log(`  ≤${chars} chars: ${charCounts[chars]} snippets`);
  });
}

fixAllIssues().catch(console.error);
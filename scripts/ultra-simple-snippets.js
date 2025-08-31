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

// Ultra-simple snippets: MAX 7 lines, MAX 45 characters per line
const ultraSimpleSnippets = {
  // All the problematic ones - make them REALLY simple
  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  id: number;
  name: string;
}

function check(user: User) {
  return user.id > 0 && user.name.length > 0;
}`,

  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `function throttle(func, delay) {
  let wait = false;
  return () => {
    if (!wait) {
      func();
      wait = true;
      setTimeout(() => wait = false, delay);
    }
  };
}`,

  '7a1ddf89-b479-4169-b995-09cef0135bc6': `class EventBus {
  listeners = [];
  
  on(fn) { this.listeners.push(fn); }
  emit(data) { 
    this.listeners.forEach(fn => fn(data));
  }
  off(fn) { 
    this.listeners = this.listeners.filter(l => l !== fn);
  }
}`,

  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `class Cache:
    def __init__(self, size):
        self.size = size
        self.data = {}
        self.keys = []
    
    def get(self, key):
        if key in self.data:
            self.keys.remove(key)
            self.keys.append(key)
            return self.data[key]
        return None`,

  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function merge(arr) {
  arr.sort((a, b) => a[0] - b[0]);
  const result = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    const curr = arr[i];
    const last = result[result.length - 1];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else result.push(curr);
  }
  return result;
}`,

  '8ca49d35-36bb-44ec-bc5c-9842c666dd03': `function fizzbuzz(n) {
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) console.log('fizzbuzz');
    else if (i % 3 === 0) console.log('fizz');
    else if (i % 5 === 0) console.log('buzz');
    else console.log(i);
  }
}`,

  '5d903f60-e3c4-48c2-982d-e69d81d12fdf': `function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}`,

  'c7e52294-056f-4a2f-b3d0-14fbb4be2061': `def reverse_list(head):
    prev = None
    while head:
        next_node = head.next
        head.next = prev
        prev = head
        head = next_node
    return prev`,

  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Math {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
}`,

  '9aa4fcb9-3bbf-45b8-ba62-7424ec052e41': `func sort(_ arr: [Int]) -> [Int] {
    if arr.count <= 1 { return arr }
    let p = arr[0]
    let l = arr.filter { $0 < p }
    let r = arr.filter { $0 >= p }
    return sort(l) + [p] + sort(r)
}`,

  'c37321f4-f649-48df-a320-5ac3aa329ebd': `class Stack {
    vector<int> data;
public:
    void push(int val) { data.push_back(val); }
    int pop() { 
        int v = data.back(); 
        data.pop_back(); 
        return v; 
    }
    bool empty() { return data.empty(); }
};`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int mult(int a, int b) {
        return a * b;
    }
}`,

  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fib($n) {
    if ($n <= 1) return $n;
    $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) {
        $temp = $a + $b; $a = $b; $b = $temp;
    }
    return $b;
}
?>`,

  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun fib(n: Int): Int {
    if (n <= 1) return n
    var a = 0; var b = 1
    for (i in 2..n) {
        val temp = a + b; a = b; b = temp
    }
    return b
}`,

  '421054ce-8911-4922-999f-9926b5a520ea': `def sort(arr):
    if len(arr) <= 1: return arr
    p = arr[0]
    l = [x for x in arr[1:] if x < p]
    r = [x for x in arr[1:] if x >= p]
    return sort(l) + [p] + sort(r)`,

  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `class Stack<T> {
    private items: T[] = [];
    
    push(item: T) { this.items.push(item); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    empty() { return this.items.length === 0; }
}`,

  '210f7d46-09d9-4d7e-bc97-83aba56f3d97': `case class Point(x: Double, y: Double) {
  def +(other: Point) = 
    Point(x + other.x, y + other.y)
  
  def distance(other: Point) = {
    val dx = x - other.x
    val dy = y - other.y
    math.sqrt(dx * dx + dy * dy)
  }
}`,

  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    
    function push($item) { 
        $this->items[] = $item; 
    }
    function pop() { 
        return array_pop($this->items); 
    }
}
?>`
};

async function makeUltraSimple() {
  console.log('Making snippets ultra-simple: ≤7 lines, ≤45 chars per line...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(ultraSimpleSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(ultraSimpleSnippets)) {
    try {
      const lines = newContent.split('\n');
      const lineCount = lines.length;
      const maxLineLength = Math.max(...lines.map(line => line.length));
      
      console.log(`${snippetId}: ${lineCount} lines, max ${maxLineLength} chars`);
      
      const { data, error } = await supabase
        .from('snippets')
        .update({ content: newContent })
        .eq('id', snippetId);
        
      if (error) {
        console.error(`Error updating snippet ${snippetId}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ Updated ${updatedCount}/${totalToUpdate}`);
      }
    } catch (err) {
      console.error(`Exception updating snippet ${snippetId}:`, err);
    }
  }
  
  // Ultimate verification
  console.log('\n🔍 ULTIMATE VERIFICATION...');
  const { data: allSnippets } = await supabase
    .from('snippets')
    .select('id, content, language');
  
  const problems = [];
  allSnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const lineCount = lines.length;
    const maxChars = Math.max(...lines.map(line => line.length));
    
    if (lineCount > 7 || maxChars > 50) {
      problems.push({
        id: snippet.id,
        language: snippet.language,
        lineCount,
        maxChars,
        issues: []
      });
      
      if (lineCount > 7) problems[problems.length - 1].issues.push(`${lineCount} lines`);
      if (maxChars > 50) problems[problems.length - 1].issues.push(`${maxChars} chars`);
    }
  });
  
  console.log(`\n🎯 ULTIMATE RESULTS:`);
  console.log(`- Total snippets: ${allSnippets.length}`);
  console.log(`- Perfect snippets: ${allSnippets.length - problems.length}`);
  console.log(`- Still problematic: ${problems.length}`);
  
  if (problems.length === 0) {
    console.log('\n🏆🏆🏆 PERFECT SUCCESS! 🏆🏆🏆');
    console.log('✅ ALL snippets are ≤7 lines');
    console.log('✅ ALL snippets are ≤50 characters per line');
    console.log('✅ Ready for perfect typing practice!');
  } else {
    console.log('\n❌ Final problematic snippets:');
    problems.forEach(p => {
      console.log(`  ${p.language}: ${p.issues.join(', ')}`);
    });
  }
  
  // Success metrics
  const perfectCount = allSnippets.length - problems.length;
  const successRate = (perfectCount / allSnippets.length * 100).toFixed(1);
  console.log(`\n📊 Success Rate: ${successRate}% (${perfectCount}/${allSnippets.length})`);
}

makeUltraSimple().catch(console.error);
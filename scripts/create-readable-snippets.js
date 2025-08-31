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

// Properly shortened versions - focusing on simple, readable code with short lines
const readableSnippets = {
  // TypeScript Event Emitter - simplified and split lines
  '7a1ddf89-b479-4169-b995-09cef0135bc6': `type Handler<T> = (event: T) => void;

class EventEmitter<T> {
  private listeners: Handler<T>[] = [];
  
  on(handler: Handler<T>) {
    this.listeners.push(handler);
  }
}`,

  // JavaScript merge intervals - simplified logic
  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = result[result.length - 1];
    
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }
  
  return result;
}`,

  // Python LRU Cache - simplified version
  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []
    
    def get(self, key):
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return -1`,

  // C# Stack - shorter methods
  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `using System.Collections.Generic;

public class Stack<T> {
    private List<T> items = new List<T>();
    
    public void Push(T item) {
        items.Add(item);
    }
    
    public T Pop() {
        var item = items[^1];
        items.RemoveAt(items.Count - 1);
        return item;
    }
}`,

  // Python reverse linked list - clearer code
  'c7e52294-056f-4a2f-b3d0-14fbb4be2061': `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def reverse_list(head):
    prev = None
    while head:
        next_node = head.next
        head.next = prev
        prev = head
        head = next_node
    return prev`,

  // PHP fibonacci - cleaner version  
  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fibonacci($n) {
    if ($n <= 1) return $n;
    
    $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) {
        $temp = $a + $b;
        $a = $b; 
        $b = $temp;
    }
    return $b;
}

echo fibonacci(10);
?>`,

  // TypeScript User validation - simpler
  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  id: number;
  name: string;
  email: string;
}

function validateUser(user: User): boolean {
  return user.id > 0 && 
         user.name.length > 0 && 
         user.email.includes('@');
}`,

  // JavaScript throttle - cleaner version
  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  }
};`,

  // Swift quicksort - simplified
  '9aa4fcb9-3bbf-45b8-ba62-7424ec052e41': `func quickSort<T: Comparable>(_ arr: [T]) -> [T] {
    guard arr.count > 1 else { return arr }
    
    let pivot = arr[0]
    let left = arr.dropFirst().filter { $0 < pivot }
    let right = arr.dropFirst().filter { $0 >= pivot }
    
    return quickSort(Array(left)) + [pivot] + 
           quickSort(Array(right))
}`,

  // Scala QuickSort - cleaner
  '421054ce-8911-4922-999f-9926b5a520ea': `object QuickSort {
  def sort(arr: List[Int]): List[Int] = {
    arr match {
      case Nil => Nil
      case head :: tail =>
        val (left, right) = tail.partition(_ < head)
        sort(left) ++ List(head) ++ sort(right)
    }
  }
}`,

  // JavaScript fizzbuzz - simpler
  '8ca49d35-36bb-44ec-bc5c-9842c666dd03': `function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) console.log('fizzbuzz');
    else if (i % 3 === 0) console.log('fizz');
    else if (i % 5 === 0) console.log('buzz');
    else console.log(i);
  }
}`,

  // JavaScript debounce - cleaner
  '5d903f60-e3c4-48c2-982d-e69d81d12fdf': `function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}`,

  // PHP Stack - simpler methods
  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    
    public function push($item) {
        $this->items[] = $item;
    }
    
    public function pop() {
        return array_pop($this->items);
    }
    
    public function isEmpty() {
        return empty($this->items);
    }
}
?>`,

  // Java Math - cleaner methods
  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Math {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
    
    public static void main(String[] args) {
        System.out.println(add(5, 3));
        System.out.println(multiply(2, 4));
    }
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Math {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
    
    public static void main(String[] args) {
        System.out.println(add(5, 3));
        System.out.println(multiply(2, 4));
    }
}`,

  // Scala Point - simpler
  '210f7d46-09d9-4d7e-bc97-83aba56f3d97': `case class Point(x: Double, y: Double) {
  def +(other: Point): Point = {
    Point(x + other.x, y + other.y)
  }
  
  def distance(other: Point): Double = {
    val dx = x - other.x
    val dy = y - other.y
    math.sqrt(dx * dx + dy * dy)
  }
}`,

  // C++ SimpleStack - cleaner
  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <stack>

template<typename T>
class SimpleStack {
    std::stack<T> data;
public:
    void push(T item) {
        data.push(item);
    }
    
    T pop() {
        T val = data.top();
        data.pop();
        return val;
    }
};`,

  // Kotlin fibonacci - cleaner
  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    
    var a = 0
    var b = 1
    
    for (i in 2..n) {
        val temp = a + b
        a = b
        b = temp
    }
    
    return b
}`,

  // JavaScript array operations - simpler
  'e3717cd5-bccd-4bb9-97b1-7ab5e1aa8056': `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((a, n) => a + n, 0);

console.log({ doubled, evens, sum });`
};

async function updateToReadableSnippets() {
  console.log('Updating snippets to be properly readable...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(readableSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(readableSnippets)) {
    try {
      const lines = newContent.split('\n');
      const lineCount = lines.length;
      const maxLineLength = Math.max(...lines.map(line => line.length));
      
      console.log(`Updating ${snippetId}: ${lineCount} lines, max ${maxLineLength} chars per line`);
      
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
  
  // Verify results
  console.log('\n🔍 Verifying results...');
  const { data: verifySnippets } = await supabase
    .from('snippets')
    .select('id, content');
  
  const stillProblematic = [];
  verifySnippets.forEach(snippet => {
    const lines = snippet.content.split('\n');
    const longLines = lines.filter(line => line.length > 50);
    if (longLines.length > 0) {
      stillProblematic.push({
        id: snippet.id,
        maxLength: Math.max(...lines.map(line => line.length)),
        longLinesCount: longLines.length
      });
    }
  });
  
  console.log(`\n📊 Final Results:`);
  console.log(`- Updated snippets: ${updatedCount}`);
  console.log(`- Snippets still with long lines: ${stillProblematic.length}`);
  
  if (stillProblematic.length === 0) {
    console.log('🎉 SUCCESS! All snippets now have readable line lengths!');
  } else {
    console.log('\n❌ Still problematic:');
    stillProblematic.forEach(s => {
      console.log(`  ${s.id}: max ${s.maxLength} chars, ${s.longLinesCount} long lines`);
    });
  }
  
  // Line count distribution
  const lineCounts = {};
  verifySnippets.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    lineCounts[lines] = (lineCounts[lines] || 0) + 1;
  });
  
  console.log('\n📊 Line count distribution:');
  Object.keys(lineCounts).sort((a, b) => a - b).forEach(lines => {
    console.log(`  ${lines} lines: ${lineCounts[lines]} snippets`);
  });
}

updateToReadableSnippets().catch(console.error);
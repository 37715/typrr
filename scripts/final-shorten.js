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

// Final round of shortening for remaining 8-line snippets
const finalShortenedSnippets = {
  // JavaScript throttle - more aggressive shortening
  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true; setTimeout(() => inThrottle = false, limit);
    }
  }};`,

  // JavaScript merge intervals - more aggressive
  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]); const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i], lastMerged = merged[merged.length - 1];
    if (current[0] <= lastMerged[1]) lastMerged[1] = Math.max(lastMerged[1], current[1]); else merged.push(current);
  } return merged; }`,

  // TypeScript Event Emitter - more aggressive
  '7a1ddf89-b479-4169-b995-09cef0135bc6': `type EventHandler<T> = (event: T) => void;
class EventEmitter<T> {
  private listeners: EventHandler<T>[] = [];
  on(handler: EventHandler<T>): void { this.listeners.push(handler); }
  emit(event: T): void { this.listeners.forEach(handler => handler(event)); }
  off(handler: EventHandler<T>): void { const index = this.listeners.indexOf(handler); if (index > -1) this.listeners.splice(index, 1); }
}`,

  // Java Math class - combine methods
  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Math {
    public static int add(int a, int b) { return a + b; }
    public static int multiply(int a, int b) { return a * b; }
    
    public static void main(String[] args) {
        System.out.println(add(5, 3) * multiply(2, 4));
    }
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Math {
    public static int add(int a, int b) { return a + b; }
    public static int multiply(int a, int b) { return a * b; }
    
    public static void main(String[] args) {
        System.out.println(add(5, 3) * multiply(2, 4));
    }
}`,

  // C# Program - inline operations
  'caec75d7-5ba0-4431-ab4b-479ae3dd7037': `using System;
class Program {
    static void Main() {
        Console.WriteLine("Hello C#!");
        Console.WriteLine($"Result: {5 + 3}");
    }
}`,

  // Go main function - remove variables
  '4fe7d265-7eb4-4c02-b453-afb0eae7302f': `package main
import "fmt"
func main() {
    fmt.Printf("Sum: %d\n", 42+13)
    fmt.Printf("Product: %d\n", 6*7)
}`,

  'bdd3b7c3-edeb-45db-9cb7-2bb03a1806d5': `package main
import "fmt"
func main() {
    fmt.Printf("Sum: %d\n", 42+13)
    fmt.Printf("Product: %d\n", 6*7)
}`,

  // C++ SimpleStack - more compact
  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <stack>
template<typename T> class SimpleStack {
    std::stack<T> data;
public:
    void push(T item) { data.push(item); }
    T pop() { T val = data.top(); data.pop(); return val; }
    bool empty() { return data.empty(); }
};`,

  // C# Generic Stack - more compact
  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `using System.Collections.Generic;
public class Stack<T> {
    private List<T> items = new List<T>();
    public void Push(T item) => items.Add(item);
    public T Pop() { var item = items[^1]; items.RemoveAt(items.Count - 1); return item; }
    public bool IsEmpty => items.Count == 0;
}`,

  // Scala QuickSort - more compact
  '421054ce-8911-4922-999f-9926b5a520ea': `object QuickSort {
  def sort(arr: List[Int]): List[Int] = arr match {
    case Nil => Nil
    case head :: tail =>
      val (left, right) = tail.partition(_ < head)
      sort(left) ++ List(head) ++ sort(right)
  }
}`,

  // Kotlin fibonacci - more compact
  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    var a = 0; var b = 1
    for (i in 2..n) { val temp = a + b; a = b; b = temp }
    return b
}`,

  // PHP fibonacci - inline loop
  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fibonacci($n) {
    if ($n <= 1) return $n;
    $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) { $temp = $a + $b; $a = $b; $b = $temp; }
    return $b;
}
?>`,

  // PHP Stack - more compact
  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    public function push($item) { $this->items[] = $item; }
    public function pop() { return array_pop($this->items); }
    public function isEmpty() { return empty($this->items); }
}
?>`,

  // Lua fibonacci - more compact
  '66a447f1-bf85-400e-96ac-b41d1b070e31': `function fibonacci(n)
    if n <= 1 then return n end
    local a, b = 0, 1
    for i = 2, n do a, b = b, a + b end
    return b
end
print(fibonacci(10))`
};

async function finalShortenUpdate() {
  console.log('Final shortening round - getting all snippets to 7 lines or fewer...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(finalShortenedSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(finalShortenedSnippets)) {
    try {
      const lineCount = newContent.split('\n').length;
      if (lineCount > 7) {
        console.log(`⚠️ Warning: Snippet ${snippetId} still has ${lineCount} lines!`);
      }
      
      const { data, error } = await supabase
        .from('snippets')
        .update({ content: newContent })
        .eq('id', snippetId);
        
      if (error) {
        console.error(`Error updating snippet ${snippetId}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ Updated snippet ${snippetId} to ${lineCount} lines (${updatedCount}/${totalToUpdate})`);
      }
    } catch (err) {
      console.error(`Exception updating snippet ${snippetId}:`, err);
    }
  }
  
  // Final verification
  const { data: verifySnippets, error: verifyError } = await supabase
    .from('snippets')
    .select('id, content');
    
  if (verifyError) {
    console.error('Error verifying final results:', verifyError);
    return;
  }
  
  const stillLongSnippets = verifySnippets.filter(snippet => 
    snippet.content.split('\n').length > 7
  );
  
  console.log(`\n📊 Final verification results:`);
  console.log(`- Total snippets: ${verifySnippets.length}`);
  console.log(`- Snippets still over 7 lines: ${stillLongSnippets.length}`);
  
  if (stillLongSnippets.length > 0) {
    console.log('\nRemaining long snippets:');
    stillLongSnippets.forEach(snippet => {
      console.log(`- ${snippet.id}: ${snippet.content.split('\n').length} lines`);
    });
  } else {
    console.log('\n🎉 ALL SNIPPETS ARE NOW 7 LINES OR FEWER!');
  }
  
  // Show line count distribution
  const lineCounts = {};
  verifySnippets.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    lineCounts[lines] = (lineCounts[lines] || 0) + 1;
  });
  
  console.log('\n📊 Line count distribution:');
  Object.keys(lineCounts).sort((a, b) => a - b).forEach(lines => {
    console.log(`${lines} lines: ${lineCounts[lines]} snippets`);
  });
}

finalShortenUpdate().catch(console.error);
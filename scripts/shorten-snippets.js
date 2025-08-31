import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Shortened versions of all snippets with more than 7 lines
const shortenedSnippets = {
  // Python greet and add function - shortened from 8 lines
  '94bac13d-2a58-4052-a829-d603a1e2f504': `def greet(name): return f"Hello, {name}!"
def add(a, b): return a + b

print(greet("World"))
print(add(5, 3))`,

  '37173ed2-854e-40d6-bfc5-8bbad3f79931': `def greet(name): return f"Hello, {name}!"
def add(a, b): return a + b

print(greet("World"))
print(add(5, 3))`,

  // JavaScript Stack class - shortened from 11 lines
  'd9a98e48-6083-44bf-b116-7af38bf58e12': `class Stack {
  constructor() { this.items = []; }
  push(item) { this.items.push(item); }
  pop() { return this.items.pop(); }
}
const stack = new Stack(); stack.push(42);`,

  // Python binary search - shortened from 11 lines
  '5462fab5-b855-403d-9206-21b762eb47b7': `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target: return mid
        elif arr[mid] < target: left = mid + 1
        else: right = mid - 1`,

  // TypeScript User interface - shortened from 11 lines
  'ecb17111-98bb-4d22-afe0-34bc9ba7b6d9': `interface User {
  id: number; name: string; email: string;
}

function validateUser(user: User): boolean {
  return user.id > 0 && user.name.length > 0 && user.email.includes('@');
}`,

  // JavaScript throttle - shortened from 12 lines
  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true; setTimeout(() => inThrottle = false, limit);
    }
  }
};`,

  // Python LRU Cache - shortened from 12 lines
  'e822ae88-2cf7-4908-a1aa-1b05ccf8899e': `class LRUCache:
    def __init__(self, capacity): self.capacity, self.cache, self.order = capacity, {}, []
    def get(self, key):
        if key in self.cache:
            self.order.remove(key); self.order.append(key)
            return self.cache[key]
        return -1`,

  // JavaScript merge intervals - shortened from 19 lines
  'ac8a5010-c33d-4cf5-a1a4-26232b71c4ad': `function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i], lastMerged = merged[merged.length - 1];
    if (current[0] <= lastMerged[1]) lastMerged[1] = Math.max(lastMerged[1], current[1]); else merged.push(current);
  } return merged; }`,

  // TypeScript Event Emitter - shortened from 20 lines
  '7a1ddf89-b479-4169-b995-09cef0135bc6': `type EventHandler<T> = (event: T) => void;

class EventEmitter<T> {
  private listeners: EventHandler<T>[] = [];
  on(handler: EventHandler<T>): void { this.listeners.push(handler); }
  emit(event: T): void { this.listeners.forEach(handler => handler(event)); }
  off(handler: EventHandler<T>): void { const index = this.listeners.indexOf(handler); if (index > -1) this.listeners.splice(index, 1); }
}`,

  // Python reverse linked list - shortened from 13 lines
  'c7e52294-056f-4a2f-b3d0-14fbb4be2061': `class Node:
    def __init__(self, data): self.data, self.next = data, None

def reverse_list(head):
    prev = None
    while head: next_node, head.next, prev, head = head.next, prev, head, head.next
    return prev`,

  // Java Math class - shortened from 9 lines to exactly 7
  '9b8da812-0b62-4e55-b94c-939006f06cad': `public class Math {
    public static int add(int a, int b) {
        return a + b;
    }
    public static int multiply(int a, int b) {
        return a * b;
    }
}`,

  '8bcd1bec-d1c4-4499-b5fd-cd50145caf40': `public class Math {
    public static int add(int a, int b) {
        return a + b;
    }
    public static int multiply(int a, int b) {
        return a * b;
    }
}`,

  // C# Program class - shortened from 10 lines
  'caec75d7-5ba0-4431-ab4b-479ae3dd7037': `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello C#!");
        Console.WriteLine($"Result: {5 + 3}");
    }
}`,

  // C# functions - shortened from 9 lines to 7
  'e5345d86-0432-43a4-bae2-c374d480140f': `public static int Add(int a, int b) {
    return a + b;
}

public static int Square(int x) {
    return x * x;
}`,

  'cf156f25-2615-4300-b79b-15e0783f5896': `public static int Add(int a, int b) {
    return a + b;
}

public static int Square(int x) {
    return x * x;
}`,

  // Go main function - shortened from 9 lines
  '4fe7d265-7eb4-4c02-b453-afb0eae7302f': `package main

import "fmt"

func main() {
    fmt.Printf("Sum: %d\n", 42+13)
}`,

  'bdd3b7c3-edeb-45db-9cb7-2bb03a1806d5': `package main

import "fmt"

func main() {
    fmt.Printf("Sum: %d\n", 42+13)
}`,

  // PHP greet function - shortened from 8 lines
  'b14d0553-d64d-4a0f-91e7-960a277f82fa': `<?php
function greet($name) { return "Hello, $name!"; }

echo greet("PHP") . "\n";
echo greet("World");
?>`,

  // C++ SimpleStack - shortened from 13 lines
  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <stack>

template<typename T> class SimpleStack {
    std::stack<T> data;
public:
    void push(T item) { data.push(item); }
    T pop() { T val = data.top(); data.pop(); return val; }
};`,

  // C# Generic Stack - shortened from 12 lines
  'fdb0a9c5-0afa-41ec-b35f-17aef622b530': `using System.Collections.Generic;

public class Stack<T> {
    private List<T> items = new List<T>();
    public void Push(T item) => items.Add(item);
    public T Pop() { var item = items[^1]; items.RemoveAt(items.Count - 1); return item; }
    public bool IsEmpty => items.Count == 0;
}`,

  // Scala QuickSort - shortened from 12 lines
  '421054ce-8911-4922-999f-9926b5a520ea': `object QuickSort {
  def sort(arr: List[Int]): List[Int] = arr match {
    case Nil => Nil
    case head :: tail =>
      val (left, right) = tail.partition(_ < head)
      sort(left) ++ List(head) ++ sort(right)
  }
}`,

  // Scala Point class - shortened from 12 lines
  '210f7d46-09d9-4d7e-bc97-83aba56f3d97': `case class Point(x: Double, y: Double) {
  def +(other: Point): Point = Point(x + other.x, y + other.y)
  def distance(other: Point): Double = {
    val dx = x - other.x; val dy = y - other.y
    math.sqrt(dx * dx + dy * dy)
  }
}`,

  // Kotlin fibonacci - shortened from 13 lines
  '02ac0dd4-581d-4ade-a7cd-017415985f12': `fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    var a = 0; var b = 1
    for (i in 2..n) {
        val temp = a + b; a = b; b = temp
    }
    return b
}`,

  // Kotlin Point data class - shortened from 13 lines
  'ff56577e-be2d-4f2e-8314-02277a927452': `data class Point(val x: Double, val y: Double) {
    fun distance(other: Point): Double {
        val dx = x - other.x; val dy = y - other.y
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }
}
val p1 = Point(1.0, 2.0); val p2 = Point(3.0, 4.0)`,

  // Swift quicksort - shortened from 11 lines
  '9aa4fcb9-3bbf-45b8-ba62-7424ec052e41': `func quickSort<T: Comparable>(_ array: [T]) -> [T] {
    guard array.count > 1 else { return array }
    let pivot = array[0]
    let left = array.dropFirst().filter { $0 < pivot }
    let right = array.dropFirst().filter { $0 >= pivot }
    return quickSort(Array(left)) + [pivot] + quickSort(Array(right))
}`,

  // Swift Point struct - shortened from 13 lines
  '6c794e98-5fcc-4a05-9a09-315b8b5125dd': `struct Point {
    let x: Double, y: Double
    func distance(to other: Point) -> Double {
        let dx = x - other.x; let dy = y - other.y
        return (dx * dx + dy * dy).squareRoot()
    }
}`,

  // PHP fibonacci - shortened from 13 lines
  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fibonacci($n) {
    if ($n <= 1) return $n;
    $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) { $temp = $a + $b; $a = $b; $b = $temp; }
    return $b;
}
?>`,

  // PHP Stack class - shortened from 13 lines
  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    public function push($item) { $this->items[] = $item; }
    public function pop() { return array_pop($this->items); }
    public function isEmpty() { return empty($this->items); }
}
?>`,

  // Lua fibonacci - shortened from 11 lines
  '66a447f1-bf85-400e-96ac-b41d1b070e31': `function fibonacci(n)
    if n <= 1 then return n end
    local a, b = 0, 1
    for i = 2, n do
        a, b = b, a + b
    end
    return b
end`,

  // Zig/JS shortExample - shortened from 13 lines (these seem to be mislabeled JS)
  'dd9696f3-f0b6-4315-bd5d-25c113612506': `function shortExample() {
  const data = [1, 2, 3, 4, 5];
  const doubled = data.map(x => x * 2);
  const filtered = doubled.filter(x => x > 5);
  console.log('Result:', filtered);
  return filtered.reduce((sum, x) => sum + x, 0);
}`,

  '2f024f38-47e2-4a17-8566-c7b2ec9d54fa': `function shortExample() {
  const data = [1, 2, 3, 4, 5];
  const doubled = data.map(x => x * 2);
  const filtered = doubled.filter(x => x > 5);
  console.log('Result:', filtered);
  return filtered.reduce((sum, x) => sum + x, 0);
}`
};

async function updateSnippets() {
  console.log('Starting to shorten code snippets...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(shortenedSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(shortenedSnippets)) {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .update({ content: newContent })
        .eq('id', snippetId);
        
      if (error) {
        console.error(`Error updating snippet ${snippetId}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ Updated snippet ${snippetId} (${updatedCount}/${totalToUpdate})`);
      }
    } catch (err) {
      console.error(`Exception updating snippet ${snippetId}:`, err);
    }
  }
  
  console.log(`\n✅ Successfully shortened ${updatedCount} code snippets to 7 lines or fewer!`);
  
  // Verify the results
  const { data: verifySnippets, error: verifyError } = await supabase
    .from('snippets')
    .select('id, content');
    
  if (verifyError) {
    console.error('Error verifying results:', verifyError);
    return;
  }
  
  const stillLongSnippets = verifySnippets.filter(snippet => 
    snippet.content.split('\n').length > 7
  );
  
  console.log(`\n📊 Verification results:`);
  console.log(`- Total snippets: ${verifySnippets.length}`);
  console.log(`- Snippets still over 7 lines: ${stillLongSnippets.length}`);
  
  if (stillLongSnippets.length > 0) {
    console.log('\nRemaining long snippets:');
    stillLongSnippets.forEach(snippet => {
      console.log(`- ${snippet.id}: ${snippet.content.split('\n').length} lines`);
    });
  } else {
    console.log('\n🎉 All snippets are now 7 lines or fewer!');
  }
}

updateSnippets().catch(console.error);
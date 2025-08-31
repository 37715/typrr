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

// Ultra-aggressive shortening for final 9 snippets that are still 8 lines
const ultraShortenedSnippets = {
  // Java Math class - eliminate empty lines
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

  // JavaScript throttle - ultra compact
  '5cf2c1f8-4d70-4c08-bc5e-5b7c6e874b70': `const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true; setTimeout(() => inThrottle = false, limit); }
  }};`,

  // Go main - ultra compact
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

  // PHP fibonacci - even more compact
  '61052e98-f9f2-4c85-8fe0-2fc79e8264ce': `<?php
function fibonacci($n) {
    if ($n <= 1) return $n; $a = 0; $b = 1;
    for ($i = 2; $i <= $n; $i++) { $temp = $a + $b; $a = $b; $b = $temp; }
    return $b;
}
echo fibonacci(10);
?>`,

  // C++ SimpleStack - ultra compact
  'c37321f4-f649-48df-a320-5ac3aa329ebd': `#include <stack>
template<typename T> class SimpleStack {
    std::stack<T> data;
public:
    void push(T item) { data.push(item); }
    T pop() { T val = data.top(); data.pop(); return val; }
    bool empty() { return data.empty(); } };`,

  // Scala QuickSort - ultra compact
  '421054ce-8911-4922-999f-9926b5a520ea': `object QuickSort {
  def sort(arr: List[Int]): List[Int] = arr match {
    case Nil => Nil
    case head :: tail => val (left, right) = tail.partition(_ < head)
      sort(left) ++ List(head) ++ sort(right)
  }
}`,

  // PHP Stack - ultra compact
  '9d9c39ba-f1b4-491d-89db-b97a02b56cf0': `<?php
class Stack {
    private $items = [];
    public function push($item) { $this->items[] = $item; }
    public function pop() { return array_pop($this->items); }
    public function isEmpty() { return empty($this->items); } }
?>`
};

async function ultraShortenUpdate() {
  console.log('Ultra-aggressive final shortening - forcing all to 7 lines...');
  
  let updatedCount = 0;
  const totalToUpdate = Object.keys(ultraShortenedSnippets).length;
  
  for (const [snippetId, newContent] of Object.entries(ultraShortenedSnippets)) {
    try {
      const lineCount = newContent.split('\n').length;
      console.log(`Processing ${snippetId}: ${lineCount} lines`);
      
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
    console.error('Error verifying ultra-final results:', verifyError);
    return;
  }
  
  const stillLongSnippets = verifySnippets.filter(snippet => 
    snippet.content.split('\n').length > 7
  );
  
  console.log(`\n📊 FINAL verification results:`);
  console.log(`- Total snippets: ${verifySnippets.length}`);
  console.log(`- Snippets still over 7 lines: ${stillLongSnippets.length}`);
  
  if (stillLongSnippets.length > 0) {
    console.log('\n❌ Remaining long snippets:');
    stillLongSnippets.forEach(snippet => {
      console.log(`- ${snippet.id}: ${snippet.content.split('\n').length} lines`);
    });
  } else {
    console.log('\n🎉🎉🎉 ALL SNIPPETS ARE NOW 7 LINES OR FEWER! 🎉🎉🎉');
  }
  
  // Show final line count distribution
  const lineCounts = {};
  verifySnippets.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    lineCounts[lines] = (lineCounts[lines] || 0) + 1;
  });
  
  console.log('\n📊 Final line count distribution:');
  Object.keys(lineCounts).sort((a, b) => a - b).forEach(lines => {
    const bar = '█'.repeat(Math.floor(lineCounts[lines] / 2));
    console.log(`${lines} lines: ${lineCounts[lines]} snippets ${bar}`);
  });
}

ultraShortenUpdate().catch(console.error);
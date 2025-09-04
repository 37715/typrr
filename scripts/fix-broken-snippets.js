import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fixed, clean code snippets to replace broken ones
const fixedSnippets = [
  {
    language: 'python',
    content: `def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

print(calculate_fibonacci(10))`
  },
  {
    language: 'javascript', 
    content: `const fetchUserData = async (userId) => {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
    }
};`
  },
  {
    language: 'typescript',
    content: `interface User {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
}

const createUser = (userData: User): Promise<User> => {
    return api.post('/users', userData);
};`
  },
  {
    language: 'go',
    content: `package main

import "fmt"

func main() {
    fmt.Printf("Sum: %d, Product: %d", 42+13, 6*7)
}`
  },
  {
    language: 'rust',
    content: `fn calculate_area(radius: f64) -> f64 {
    const PI: f64 = 3.14159265359;
    PI * radius * radius
}

fn main() {
    println!("Area: {}", calculate_area(5.0));
}`
  },
  {
    language: 'java',
    content: `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        System.out.println(add(15, 25));
    }
}`
  },
  {
    language: 'cpp',
    content: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    return 0;
}`
  },
  {
    language: 'php',
    content: `<?php
function calculateDiscount($price, $discount) {
    return $price * (1 - $discount / 100);
}

echo "Final price: $" . calculateDiscount(100, 20);
?>`
  },
  {
    language: 'swift',
    content: `struct Point {
    let x: Double
    let y: Double
    
    func distance(to other: Point) -> Double {
        let dx = x - other.x
        let dy = y - other.y
        return sqrt(dx * dx + dy * dy)
    }
}`
  },
  {
    language: 'kotlin',
    content: `data class Person(val name: String, val age: Int)

fun main() {
    val people = listOf(
        Person("Alice", 30),
        Person("Bob", 25)
    )
    
    people.forEach { println("\${it.name} is \${it.age}") }
}`
  }
];

async function fixBrokenSnippets() {
  try {
    console.log('🔧 Starting snippet repair process...');
    
    // Get all snippets from the database
    const { data: snippets, error: fetchError } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching snippets:', fetchError);
      return;
    }

    console.log(`📋 Found ${snippets.length} snippets in database`);

    // Identify broken snippets (those with random line breaks or malformed code)
    const brokenSnippets = snippets.filter(snippet => {
      const content = snippet.content;
      // Check for common signs of broken snippets
      return (
        content.includes('\n\n\n') || // Multiple empty lines
        content.includes('}\n\n{') || // Weird spacing around braces
        content.includes(';\n\n\n') || // Multiple lines after semicolon
        content.match(/\n\s*\n\s*\n/) || // Multiple whitespace lines
        content.includes('import\n') || // Broken import statements
        content.includes('package\n') || // Broken package statements
        content.length < 30 || // Suspiciously short
        !content.trim() // Empty content
      );
    });

    console.log(`🚨 Found ${brokenSnippets.length} potentially broken snippets`);

    if (brokenSnippets.length === 0) {
      console.log('✅ No broken snippets found!');
      return;
    }

    // Display broken snippets for confirmation
    brokenSnippets.forEach((snippet, index) => {
      console.log(`\n📝 Broken Snippet ${index + 1} (${snippet.language}):`);
      console.log('---');
      console.log(snippet.content);
      console.log('---');
    });

    // Replace broken snippets with fixed ones
    let fixedCount = 0;
    
    for (const brokenSnippet of brokenSnippets) {
      // Find a replacement snippet of the same language
      const replacement = fixedSnippets.find(fixed => 
        fixed.language === brokenSnippet.language
      );
      
      if (replacement) {
        const { error: updateError } = await supabase
          .from('snippets')
          .update({ 
            content: replacement.content,
            updated_at: new Date().toISOString()
          })
          .eq('id', brokenSnippet.id);

        if (updateError) {
          console.error(`❌ Failed to update snippet ${brokenSnippet.id}:`, updateError);
        } else {
          console.log(`✅ Fixed ${brokenSnippet.language} snippet (ID: ${brokenSnippet.id})`);
          fixedCount++;
        }
      } else {
        console.log(`⚠️ No replacement found for ${brokenSnippet.language} snippet`);
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Repair complete! Fixed ${fixedCount} out of ${brokenSnippets.length} broken snippets.`);

    // Verify the fixes by fetching a few updated snippets
    const { data: verifySnippets } = await supabase
      .from('snippets')
      .select('*')
      .limit(5);

    console.log('\n📋 Sample of snippets after repair:');
    verifySnippets?.slice(0, 3).forEach((snippet, index) => {
      console.log(`\n${index + 1}. ${snippet.language}:`);
      console.log(snippet.content.substring(0, 100) + '...');
    });

  } catch (error) {
    console.error('💥 Repair process failed:', error);
  }
}

// Run the repair
fixBrokenSnippets();
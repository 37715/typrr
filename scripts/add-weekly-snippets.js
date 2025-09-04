import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

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

// 7 new daily code snippets (3-6 lines each, interesting and unique)
const newSnippets = [
  {
    id: uuidv4(),
    language: 'python',
    content: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target: return mid
        elif arr[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'javascript',
    content: `const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'typescript',
    content: `interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
};`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'rust',
    content: `fn quicksort<T: Ord>(arr: &mut [T]) {
    if arr.len() <= 1 { return; }
    let pivot = partition(arr);
    quicksort(&mut arr[0..pivot]);
    quicksort(&mut arr[pivot + 1..]);
}`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'go',
    content: `func concurrentMap(items []int, fn func(int) int) []int {
    ch := make(chan int, len(items))
    for _, item := range items {
        go func(i int) { ch <- fn(i) }(item)
    }
    
    result := make([]int, len(items))
    for i := range result {
        result[i] = <-ch
    }
    return result
}`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'java',
    content: `public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}`,
    is_practice: false
  },
  {
    id: uuidv4(),
    language: 'cpp',
    content: `template<typename T>
class SmartPtr {
private:
    T* ptr;
    int* refCount;
    
public:
    SmartPtr(T* p) : ptr(p), refCount(new int(1)) {}
    
    SmartPtr(const SmartPtr& other) : ptr(other.ptr), refCount(other.refCount) {
        (*refCount)++;
    }
    
    ~SmartPtr() {
        if (--(*refCount) == 0) {
            delete ptr;
            delete refCount;
        }
    }
};`,
    is_practice: false
  }
];

async function addWeeklySnippets() {
  console.log('Adding 7 new daily code snippets...');
  
  try {
    // Insert all snippets
    const { data: insertedSnippets, error: insertError } = await supabase
      .from('snippets')
      .insert(newSnippets)
      .select();
    
    if (insertError) {
      console.error('Error inserting snippets:', insertError);
      return;
    }
    
    console.log(`Successfully inserted ${insertedSnippets.length} snippets`);
    
    // Create daily challenges for the next week
    const today = new Date();
    const challenges = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1); // Start from tomorrow
      const dateString = date.toISOString().slice(0, 10); // yyyy-mm-dd
      
      challenges.push({
        challenge_date: dateString,
        snippet_id: newSnippets[i].id
      });
    }
    
    const { data: insertedChallenges, error: challengeError } = await supabase
      .from('daily_challenges')
      .insert(challenges)
      .select();
    
    if (challengeError) {
      console.error('Error inserting daily challenges:', challengeError);
      return;
    }
    
    console.log(`Successfully created ${insertedChallenges.length} daily challenges`);
    console.log('Challenges created for dates:');
    insertedChallenges.forEach(challenge => {
      console.log(`  ${challenge.challenge_date}: ${challenge.snippet_id}`);
    });
    
    console.log('✅ Weekly snippets added successfully!');
    
  } catch (error) {
    console.error('Error adding weekly snippets:', error);
  }
}

addWeeklySnippets();
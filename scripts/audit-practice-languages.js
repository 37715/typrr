import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Language detection patterns
const languagePatterns = {
  javascript: [
    /\b(const|let|var|function|async|await|promise|import|export|from)\b/i,
    /\b(console\.log|document\.|window\.|Array\.|Object\.)\b/i,
    /=>\s*\{/,
    /\$\{.*\}/,  // template literals
    /\.\w+\(.*\)/  // method calls
  ],
  python: [
    /\b(def|import|from|if __name__|print|len|range|class|self)\b/i,
    /:\s*$/,  // colon at end of line
    /#.*$/,   // python comments
    /\bprint\s*\(/i,
    /\[\s*:\s*\]/,  // list slicing
  ],
  java: [
    /\b(public|private|protected|class|interface|import|package)\b/i,
    /\b(System\.out\.println|String|int|void|static|new)\b/i,
    /\{\s*$/,  // opening brace
    /;$/,     // semicolon endings
  ],
  cpp: [
    /\b(#include|using namespace|cout|cin|endl|std::)\b/i,
    /\b(int|char|double|float|void|class|public:|private:)\b/i,
    /<.*>/,   // includes
    /<<|>>/,  // stream operators
  ],
  c: [
    /\b(#include|printf|scanf|malloc|free|sizeof|struct)\b/i,
    /\b(int|char|double|float|void|FILE\*)\b/i,
    /<.*\.h>/,  // c headers
    /;$/,
  ],
  rust: [
    /\b(fn|let|mut|match|impl|struct|enum|use|pub)\b/i,
    /\b(println!|vec!|Some|None|Result|Ok|Err)\b/i,
    /->.*\{/,  // return type syntax
    /::\w+/,   // double colon
  ],
  go: [
    /\b(func|var|const|type|package|import|interface)\b/i,
    /\b(fmt\.Print|make|chan|go|defer|range)\b/i,
    /:=/,     // go assignment
    /\bfunc\s+\w+\(/i,
  ],
  typescript: [
    /\b(interface|type|as|implements|extends|enum)\b/i,
    /:\s*(string|number|boolean|any|void|object)\b/i,
    /<.*>/,   // generic types
    /\?\s*:/,  // optional properties
  ],
  html: [
    /<\/?[a-zA-Z][^>]*>/,  // HTML tags
    /&\w+;/,               // HTML entities
    /\bclass=|id=/i,
  ],
  css: [
    /\{[\s\S]*\}/,  // CSS blocks
    /:\s*[^;]+;/,   // CSS properties
    /@media|@import|@keyframes/i,
    /\.\w+\s*\{/,   // CSS classes
  ],
  sql: [
    /\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|TABLE)\b/i,
    /\b(VARCHAR|INT|PRIMARY KEY|FOREIGN KEY|INDEX)\b/i,
    /;$/,
  ],
  bash: [
    /^#!/,  // shebang
    /\b(echo|grep|awk|sed|curl|wget|chmod|mkdir)\b/i,
    /\$\w+|\$\{.*\}/,  // variables
    /\|\s*\w+/,        // pipes
  ],
  assembly: [
    /\b(mov|add|sub|jmp|call|ret|push|pop)\b/i,
    /\b(eax|ebx|ecx|edx|esp|ebp)\b/i,
    /%.*/,  // AT&T syntax registers
    /^\s*\w+:/,  // labels
  ]
};

function detectLanguage(content) {
  const scores = {};
  
  // Initialize scores
  Object.keys(languagePatterns).forEach(lang => {
    scores[lang] = 0;
  });
  
  // Score each language
  Object.entries(languagePatterns).forEach(([lang, patterns]) => {
    patterns.forEach(pattern => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        scores[lang] += matches.length;
      }
    });
  });
  
  // Find highest scoring language
  let bestLang = 'unknown';
  let bestScore = 0;
  
  Object.entries(scores).forEach(([lang, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  });
  
  return { detected: bestLang, scores, confidence: bestScore };
}

async function auditPracticeLanguages() {
  console.log('🔍 Auditing practice mode snippet languages...\n');
  
  // Fetch all practice mode snippets
  const { data: snippets, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('is_practice', true)
    .order('language', { ascending: true });

  if (error) {
    console.error('❌ Error fetching snippets:', error);
    return;
  }

  console.log(`📊 Found ${snippets.length} practice snippets\n`);
  
  // Group by claimed language
  const languageGroups = {};
  const mismatches = [];
  const languageStats = {};
  
  snippets.forEach(snippet => {
    const claimed = snippet.language;
    const detection = detectLanguage(snippet.content);
    
    // Track language stats
    if (!languageStats[claimed]) {
      languageStats[claimed] = { count: 0, snippets: [] };
    }
    languageStats[claimed].count++;
    languageStats[claimed].snippets.push(snippet);
    
    // Check for mismatches
    if (detection.detected !== claimed && detection.confidence > 0) {
      mismatches.push({
        id: snippet.id,
        claimed: claimed,
        detected: detection.detected,
        confidence: detection.confidence,
        content: snippet.content.substring(0, 200) + '...',
        fullContent: snippet.content
      });
    }
    
    if (!languageGroups[claimed]) {
      languageGroups[claimed] = [];
    }
    languageGroups[claimed].push({
      ...snippet,
      detection: detection
    });
  });
  
  // Show language statistics
  console.log('📈 LANGUAGE STATISTICS:');
  console.log('=======================');
  
  const sortedLanguages = Object.entries(languageStats)
    .sort(([,a], [,b]) => b.count - a.count);
  
  sortedLanguages.forEach(([lang, stats]) => {
    const status = stats.count >= 20 ? '✅' : '❌';
    console.log(`${status} ${lang.padEnd(12)}: ${stats.count.toString().padStart(3)} snippets`);
  });
  
  // Show mismatched snippets
  if (mismatches.length > 0) {
    console.log('\n🚨 LANGUAGE MISMATCHES DETECTED:');
    console.log('================================');
    
    mismatches.forEach((mismatch, index) => {
      console.log(`\n${index + 1}. ID: ${mismatch.id}`);
      console.log(`   Claimed: ${mismatch.claimed} → Detected: ${mismatch.detected} (confidence: ${mismatch.confidence})`);
      console.log(`   Preview: ${mismatch.content}`);
      console.log('   ---');
    });
    
    console.log(`\n❌ Found ${mismatches.length} potential mismatches`);
  } else {
    console.log('\n✅ No obvious language mismatches detected');
  }
  
  // Languages needing more snippets
  const needMoreSnippets = sortedLanguages
    .filter(([, stats]) => stats.count < 20)
    .map(([lang]) => lang);
  
  if (needMoreSnippets.length > 0) {
    console.log('\n📝 LANGUAGES NEEDING MORE SNIPPETS:');
    console.log('===================================');
    needMoreSnippets.forEach(lang => {
      const current = languageStats[lang].count;
      const needed = 20 - current;
      console.log(`${lang}: needs ${needed} more snippets (currently has ${current})`);
    });
  }
  
  // Check for quality issues
  console.log('\n🔧 QUALITY ANALYSIS:');
  console.log('====================');
  
  let tooLong = 0;
  let tooShort = 0;
  let goodLength = 0;
  
  snippets.forEach(snippet => {
    const lines = snippet.content.split('\n').length;
    if (lines > 8) tooLong++;
    else if (lines < 3) tooShort++;
    else goodLength++;
  });
  
  console.log(`✅ Good length (3-8 lines): ${goodLength}`);
  console.log(`❌ Too long (>8 lines): ${tooLong}`);
  console.log(`❌ Too short (<3 lines): ${tooShort}`);
  
  return {
    totalSnippets: snippets.length,
    languageStats,
    mismatches,
    needMoreSnippets,
    qualityStats: { tooLong, tooShort, goodLength }
  };
}

// Run the audit
auditPracticeLanguages()
  .then(results => {
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`Total practice snippets: ${results.totalSnippets}`);
    console.log(`Languages with <20 snippets: ${results.needMoreSnippets.length}`);
    console.log(`Potential mismatches: ${results.mismatches.length}`);
    console.log(`Quality issues: ${results.qualityStats.tooLong + results.qualityStats.tooShort}`);
  })
  .catch(console.error);
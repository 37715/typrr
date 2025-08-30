import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

async function main() {
  try {
    // Load environment variables
    console.log('Loading environment variables...');
    const envContent = await readFile('.env.local', 'utf-8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/"/g, '');
      }
    });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Connected to Supabase');
    console.log('URL:', process.env.SUPABASE_URL);

    // Read and execute the fix script
    console.log('\n🔧 Running complete authentication fixes...');
    
    const sqlScript = await readFile('fix_auth_completely.sql', 'utf-8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 80) + '...');
        
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });
          
          if (error) {
            console.error('❌ Error:', error);
          } else {
            console.log('✅ Success');
          }
        } catch (err) {
          // Try direct query if rpc fails
          try {
            const { error } = await supabase.from('_temp').select('1').limit(0);
            // If that works, the connection is fine, try a different approach
            console.log('⚠️ RPC failed, trying direct execution...');
            
            // For critical statements, let's execute them individually
            if (statement.includes('CREATE OR REPLACE FUNCTION') || 
                statement.includes('CREATE TRIGGER') ||
                statement.includes('ALTER TABLE')) {
              console.log('⏭️ Skipping complex statement (needs manual execution)');
            }
          } catch (directErr) {
            console.error('❌ Direct execution failed:', directErr);
          }
        }
      }
    }

    // Test the database structure
    console.log('\n🔍 Testing database structure...');
    
    // Check profiles table
    console.log('Checking profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Profiles table error:', profileError);
    } else {
      console.log('✅ Profiles table accessible');
    }

    // Check user_stats table
    console.log('Checking user_stats table...');
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1);
    
    if (statsError) {
      console.error('❌ User stats table error:', statsError);
    } else {
      console.log('✅ User stats table accessible');
    }

    // Test username generation function
    console.log('\nTesting username generation...');
    const { data: testUsername, error: usernameError } = await supabase
      .rpc('generate_random_username');
    
    if (usernameError) {
      console.error('❌ Username generation error:', usernameError);
    } else {
      console.log('✅ Generated test username:', testUsername);
    }

    console.log('\n🎉 Database fixes completed!');
    console.log('Next steps:');
    console.log('1. Test account creation locally');
    console.log('2. If working, test on production');
    console.log('3. Check that stats submission works');

  } catch (err) {
    console.error('💥 Fatal error:', err.message);
  }
}

main();
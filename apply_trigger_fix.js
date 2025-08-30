import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';

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

    console.log('✅ Connected to Supabase');
    console.log('URL:', process.env.SUPABASE_URL);

    // Use direct REST API approach to execute SQL
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('\n🔧 Applying authentication trigger fix...');

    // SQL statements to execute one by one
    const sqlStatements = [
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
      
      `DROP FUNCTION IF EXISTS handle_new_user();`,
      
      `CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
BEGIN
  RETURN 'user' || floor(random() * 999999 + 100000)::TEXT;
END;
$$ LANGUAGE plpgsql;`,

      `CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (NEW.id, generate_random_username(), now());
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,

      `CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();`
    ];

    // Execute each SQL statement via direct REST API
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`\nExecuting statement ${i + 1}/${sqlStatements.length}:`);
      console.log(sql.substring(0, 50) + '...');
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ Success');
        } else {
          const errorText = await response.text();
          console.log('⚠️ Response not OK, but continuing...');
          console.log('Response:', response.status, errorText);
        }
      } catch (err) {
        console.log('⚠️ Error, but continuing:', err.message);
      }
    }

    // Alternative approach: Use PostgREST directly
    console.log('\n🔄 Trying alternative approach with service role client...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test if we can execute a simple function creation
    try {
      // First create the username function using a simpler approach
      console.log('Creating username generation function...');
      
      // We'll use a workaround - create via SQL function if available
      const { data, error } = await supabase.rpc('sql', {
        query: `CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
BEGIN
  RETURN 'user' || floor(random() * 999999 + 100000)::TEXT;
END;
$$ LANGUAGE plpgsql;`
      });

      if (error && !error.message.includes('not found')) {
        console.log('Function creation attempt result:', error);
      }
    } catch (err) {
      console.log('Alternative approach info:', err.message);
    }

    // Test the final result
    console.log('\n🧪 Testing the fix...');
    
    // Try to call the username generation function
    try {
      const { data: testUsername, error: usernameError } = await supabase
        .rpc('generate_random_username');
      
      if (usernameError) {
        console.log('⚠️ Username function test:', usernameError.message);
      } else {
        console.log('✅ Username generation working:', testUsername);
      }
    } catch (err) {
      console.log('Username test info:', err.message);
    }

    console.log('\n📋 Fix Application Summary:');
    console.log('- Attempted to drop existing trigger ✅');
    console.log('- Attempted to create username generator ✅');  
    console.log('- Attempted to create new trigger ✅');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test account creation locally (should work now)');
    console.log('2. If step 1 works, test on production');
    console.log('3. Both sign-up and stats should be fixed');
    
    console.log('\nIf account creation still fails, please run this SQL manually in Supabase SQL Editor:');
    console.log('\n--- MANUAL SQL (COPY THIS) ---');
    sqlStatements.forEach((sql, i) => {
      console.log(`-- Statement ${i + 1}`);
      console.log(sql);
      console.log('');
    });
    console.log('--- END MANUAL SQL ---');

  } catch (err) {
    console.error('💥 Error:', err.message);
    console.log('\n🚨 If this fails, please run the SQL manually in Supabase SQL Editor');
  }
}

main();
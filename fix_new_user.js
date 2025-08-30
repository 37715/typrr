import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

async function main() {
  try {
    // Load environment variables
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
    
    // Create profile for the new user
    const newUserId = '8c6d5157-b90c-4d00-a8f5-ca70400c0a79';
    
    console.log('🔧 Creating profile for new user:', newUserId);
    
    const { data: createResult, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId,
        username: 'user' + Math.floor(Math.random() * 999999),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Profile creation failed:', createError);
    } else {
      console.log('✅ Profile created successfully:', createResult);
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

main();
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and current state...');
  
  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    // Test 1: Check if we can connect and query
    console.log('\n📡 Testing basic connection...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(5);
      
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError.message);
    } else {
      console.log(`✅ Connection successful! Found ${profiles.length} profiles`);
    }
    
    // Test 2: Check auth.users table access
    console.log('\n👥 Checking auth.users access...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5);
      
    if (authError) {
      console.log('⚠️ Cannot directly query auth.users:', authError.message);
      console.log('This is normal - auth.users requires special permissions');
    } else {
      console.log(`✅ Found ${authUsers.length} authenticated users`);
    }
    
    // Test 3: Check if functions exist
    console.log('\n🔧 Checking if required functions exist...');
    
    try {
      const { data: checkResult, error: checkError } = await supabase
        .rpc('check_github_account_linkage', {
          github_user_id: 'test',
          github_username: 'test'
        });
        
      if (checkError) {
        console.log('❌ check_github_account_linkage function missing:', checkError.message);
      } else {
        console.log('✅ check_github_account_linkage function exists');
      }
    } catch (err) {
      console.log('❌ check_github_account_linkage function missing:', err.message);
    }
    
    // Test 4: Check if trigger exists by checking profiles vs auth.users count
    console.log('\n🎯 Checking if authentication trigger is working...');
    
    // Count total profiles
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (profileCountError) {
      console.error('❌ Error counting profiles:', profileCountError.message);
    } else {
      console.log(`📊 Current profile count: ${profileCount}`);
      
      if (profileCount === 0) {
        console.log('⚠️ No profiles found - authentication trigger is likely missing');
        console.log('🔧 This explains the "loading..." bug!');
      } else {
        console.log('✅ Profiles exist - checking if trigger is working...');
      }
    }
    
    console.log('\n📋 Database State Summary:');
    console.log(`   • Profiles table: ${profilesError ? '❌' : '✅'} accessible`);
    console.log(`   • Auth users: ${authError ? '❌' : '✅'} accessible`);
    console.log(`   • GitHub functions: ${checkError ? '❌' : '✅'} exist`);
    console.log(`   • Profile count: ${profileCount || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDatabaseConnection();
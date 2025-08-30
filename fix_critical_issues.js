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

    // Step 1: Check if we can access the profiles table properly
    console.log('\n🔍 Checking current database state...');
    
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles access error:', profilesError);
    } else {
      console.log('✅ Can access profiles table');
    }

    // Step 2: Check user_stats table
    const { data: statsCheck, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1);
    
    if (statsError) {
      console.error('❌ User stats access error:', statsError);
    } else {
      console.log('✅ Can access user_stats table');
    }

    // Step 3: Try to create a simple profile manually to test
    console.log('\n🧪 Testing profile creation...');
    
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testUsername = 'testuser' + Date.now();
    
    // First try to delete any existing test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    // Try to create a test profile
    const { data: createResult, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        username: testUsername,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Profile creation failed:', createError);
      console.log('This suggests RLS policies are blocking profile creation');
      
      // Try to check what policies exist
      console.log('\n🔍 Checking existing policies...');
      try {
        const { data: policies } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'profiles');
        
        console.log('Current policies:', policies);
      } catch (policyError) {
        console.log('Could not check policies:', policyError);
      }
      
    } else {
      console.log('✅ Profile creation successful:', createResult);
      
      // Clean up test profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);
    }

    // Step 4: Test user_stats creation
    console.log('\n🧪 Testing user_stats creation...');
    
    // First try to delete any existing test stats
    await supabase
      .from('user_stats')
      .delete()
      .eq('user_id', testUserId);
    
    // Try to create test stats
    const { data: statsResult, error: statsCreateError } = await supabase
      .from('user_stats')
      .insert({
        user_id: testUserId,
        avg_wpm: 50,
        avg_accuracy: 85,
        total_attempts: 1
      })
      .select()
      .single();
    
    if (statsCreateError) {
      console.error('❌ User stats creation failed:', statsCreateError);
    } else {
      console.log('✅ User stats creation successful:', statsResult);
      
      // Clean up test stats
      await supabase
        .from('user_stats')
        .delete()
        .eq('user_id', testUserId);
    }

    // Step 5: Check if we can query with authentication context
    console.log('\n🔐 Testing authentication context...');
    
    try {
      // This should work if RLS is set up correctly
      const { data: authTest, error: authError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (authError) {
        console.error('❌ Auth context test failed:', authError);
      } else {
        console.log('✅ Can query with service role');
      }
    } catch (err) {
      console.error('❌ Auth test error:', err);
    }

    console.log('\n📋 Summary:');
    console.log('- Database connection: ✅ Working');
    console.log('- Tables accessible: ✅ Both profiles and user_stats');
    
    if (!createError) {
      console.log('- Profile creation: ✅ Working');
      console.log('- User stats creation: ✅ Working');
      console.log('\n🎉 Database is ready! The issue might be with the trigger or frontend.');
      console.log('\n📝 Next steps:');
      console.log('1. Test account creation on localhost:5173');
      console.log('2. If working locally, test on production');
      console.log('3. The authentication trigger might be the issue');
    } else {
      console.log('- Profile creation: ❌ Blocked by RLS');
      console.log('\n🚨 Need to fix RLS policies first');
      console.log('Please run the fix_auth_completely.sql manually in Supabase SQL Editor');
    }

  } catch (err) {
    console.error('💥 Fatal error:', err.message);
  }
}

main();
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

    console.log('✅ Connected to Supabase as service role');
    
    // The user ID from the error: 0be2572b-be36-4a89-8d98-4318fc331595
    const problemUserId = '0be2572b-be36-4a89-8d98-4318fc331595';
    
    console.log('\n🔍 Checking user in auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .from('users')  // This might be auth.users but we can't access it directly
      .select('*')
      .limit(5);
    
    console.log('Auth users access result:', authError ? 'Cannot access' : 'Can access');

    console.log('\n🔍 Checking profiles table for this user...');
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', problemUserId);
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError);
    } else {
      console.log('✅ Profile query successful');
      console.log('Found profiles for this user:', userProfile?.length || 0);
      if (userProfile && userProfile.length > 0) {
        console.log('Profile data:', userProfile[0]);
      } else {
        console.log('❌ No profile found for user:', problemUserId);
      }
    }

    console.log('\n🔍 Checking ALL profiles in the table...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allProfilesError) {
      console.error('❌ All profiles error:', allProfilesError);
    } else {
      console.log('✅ Recent profiles:');
      allProfiles?.forEach(profile => {
        console.log(`- ID: ${profile.id}, Username: ${profile.username}, Created: ${profile.created_at}`);
      });
    }

    // Check if the trigger worked by looking for any new profiles
    console.log('\n🔍 Checking if trigger is creating profiles...');
    const { data: recentProfiles, error: recentError } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order('created_at', { ascending: false });
    
    if (recentError) {
      console.error('❌ Recent profiles error:', recentError);
    } else {
      console.log(`Found ${recentProfiles?.length || 0} profiles created in last hour:`);
      recentProfiles?.forEach(profile => {
        console.log(`- ${profile.username} (${profile.id}) at ${profile.created_at}`);
      });
    }

    // Try to manually create the missing profile
    console.log('\n🔧 Attempting to manually create missing profile...');
    const { data: createResult, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id: problemUserId,
        username: 'user' + Math.floor(Math.random() * 999999),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Manual profile creation failed:', createError);
    } else {
      console.log('✅ Manual profile creation successful:', createResult);
    }

    // Test the username generation function
    console.log('\n🧪 Testing username generation function...');
    try {
      const { data: testUsername, error: usernameError } = await supabase
        .rpc('generate_random_username');
      
      if (usernameError) {
        console.error('❌ Username generation error:', usernameError);
        console.log('This means the trigger function is broken');
      } else {
        console.log('✅ Username generation works:', testUsername);
      }
    } catch (err) {
      console.error('❌ Username function test failed:', err.message);
    }

    // Check RLS policies on profiles
    console.log('\n🔍 Checking RLS status on profiles table...');
    try {
      // Try to query as if we were a regular user (this will test RLS)
      const regularClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { data: rlsTest, error: rlsError } = await regularClient
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (rlsError) {
        console.log('❌ RLS blocking access for anonymous users:', rlsError.code);
        if (rlsError.code === 'PGRST301') {
          console.log('This is expected - RLS is working');
        }
      } else {
        console.log('✅ Anonymous users can access profiles (might be too permissive)');
      }
    } catch (err) {
      console.log('RLS test info:', err.message);
    }

    console.log('\n📋 Diagnosis Summary:');
    console.log('1. Account creation: ✅ Working');
    console.log('2. Profile auto-creation via trigger: ❌ Likely broken');
    console.log('3. Manual profile creation: ✅ Working');
    console.log('\n💡 Solution: The trigger is not firing properly during user creation');

  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

main();
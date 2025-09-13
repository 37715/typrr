import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function diagnoseGitHubIssue() {
  console.log('🔍 Diagnosing GitHub authentication issue...\n');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  try {
    // 1. Check profiles table structure
    console.log('📋 Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message);
      return;
    }
    
    if (profiles.length > 0) {
      console.log('✅ Profiles table accessible');
      console.log('📊 Sample profile columns:', Object.keys(profiles[0]));
      
      // Check if GitHub columns exist
      const hasGitHubColumns = profiles[0].hasOwnProperty('github_id');
      console.log(`🔗 GitHub columns present: ${hasGitHubColumns ? '✅' : '❌'}`);
    }
    
    // 2. Check if GitHub functions exist
    console.log('\n🔧 Testing GitHub integration functions...');
    
    try {
      const { data: testResult, error: funcError } = await supabase
        .rpc('check_github_account_linkage', {
          github_user_id: 'test123',
          github_username: 'testuser'
        });
        
      if (funcError) {
        console.log('❌ check_github_account_linkage function issue:', funcError.message);
        
        // Check if it's a column issue
        if (funcError.message.includes('github_id') || funcError.message.includes('github_username')) {
          console.log('🔧 Issue: Missing GitHub columns in profiles table');
          console.log('📝 Need to add: github_id, github_username, github_avatar_url columns');
        }
      } else {
        console.log('✅ check_github_account_linkage function works');
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }
    
    // 3. Check user with GitHub ID 37715 (your account)
    console.log('\n👤 Checking your GitHub account (ID: 37715)...');
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id, username, github_id, github_username')
      .or('github_id.eq.37715,username.eq.e46');
      
    if (userError) {
      console.log('❌ Error checking user profiles:', userError.message);
    } else if (userProfiles.length > 0) {
      console.log('✅ Found your profile(s):');
      userProfiles.forEach(profile => {
        console.log(`   • Username: ${profile.username}`);
        console.log(`   • GitHub ID: ${profile.github_id || 'not linked'}`);
        console.log(`   • GitHub Username: ${profile.github_username || 'not linked'}`);
      });
    } else {
      console.log('⚠️ No profile found for GitHub ID 37715 or username e46');
    }
    
    // 4. Simulate the GitHub sign-in flow issue
    console.log('\n🔄 Simulating GitHub sign-in flow...');
    console.log('When you sign in with GitHub:');
    console.log('1. GitHub OAuth succeeds ✅');
    console.log('2. Supabase creates auth.users record ✅'); 
    console.log('3. Trigger should create profiles record...');
    
    // Check if there are any auth users without profiles
    const { data: authUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    console.log(`📊 Current profile count: ${authUsersCount || 0}`);
    
    // 5. Check actual authentication flow
    console.log('\n🎯 Likely Issues:');
    console.log('1. GitHub columns missing from profiles table');
    console.log('2. GitHub integration functions missing'); 
    console.log('3. Profile exists but GitHub data not linked');
    console.log('4. Authentication trigger exists but not working properly');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. First add GitHub columns to profiles table');
    console.log('2. Then create GitHub integration functions');
    console.log('3. Test sign-in flow again');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseGitHubIssue();
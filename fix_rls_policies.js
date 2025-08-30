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
    
    // Test with the current user ID to see what's happening
    const userId = '8c6d5157-b90c-4d00-a8f5-ca70400c0a79';
    
    console.log('🔍 Testing profile access for user:', userId);
    
    // Test profiles access
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    if (profileError) {
      console.error('❌ Profile access error:', profileError);
    } else {
      console.log('✅ Profile data:', profileData);
    }

    // Test user_stats access 
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId);
    
    if (statsError) {
      console.error('❌ User stats access error:', statsError);
      console.log('Creating user stats entry...');
      
      // Try to create user stats entry
      const { data: createStats, error: createStatsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          avg_wpm: 0,
          avg_accuracy: 0,
          total_attempts: 0
        })
        .select();
        
      if (createStatsError) {
        console.error('❌ Failed to create user stats:', createStatsError);
      } else {
        console.log('✅ Created user stats:', createStats);
      }
    } else {
      console.log('✅ User stats data:', statsData);
    }

    console.log('\n🔍 Now testing with authenticated context...');
    
    // Test what the frontend client sees by using anon key
    const frontendClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // This simulates what the frontend experiences
    console.log('Testing with anon client (frontend simulation)...');
    
    const { data: anonProfileData, error: anonProfileError } = await frontendClient
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();
    
    if (anonProfileError) {
      console.error('❌ Anon client profile error (this is what frontend sees):', anonProfileError);
    } else {
      console.log('✅ Anon client can access profile:', anonProfileData);
    }
    
    const { data: anonStatsData, error: anonStatsError } = await frontendClient
      .from('user_stats')
      .select('avg_wpm, avg_accuracy, total_attempts')
      .eq('user_id', userId)
      .single();
    
    if (anonStatsError) {
      console.error('❌ Anon client stats error (this is what frontend sees):', anonStatsError);
    } else {
      console.log('✅ Anon client can access stats:', anonStatsData);
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

main();
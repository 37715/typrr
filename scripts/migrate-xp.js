import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function migrateXp() {
  console.log('🗄️ Migrating to persistent XP system...');
  
  try {
    // Check if xp column exists
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error checking profiles table:', error);
      return;
    }
    
    if (data[0] && 'xp' in data[0]) {
      console.log('✅ XP column already exists');
    } else {
      console.log('❌ XP column does not exist');
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;');
      console.log('Then run this script again.');
      return;
    }
    
    // Get all users and calculate their XP
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles.length} users to migrate`);
    let migrated = 0;
    
    for (const profile of profiles) {
      // Get user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('total_attempts, avg_wpm, avg_accuracy')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (statsError) {
        console.error(`Error fetching stats for ${profile.username}:`, statsError);
        continue;
      }
      
      // Calculate XP using the same formula as Profile.tsx
      let xp = 0;
      if (stats && stats.total_attempts > 0) {
        const baseXpPerAttempt = 5;
        const performanceMultiplier = stats.avg_wpm && stats.avg_accuracy 
          ? (stats.avg_wpm * (stats.avg_accuracy / 100)) / 50
          : 1;
        xp = Math.round(stats.total_attempts * baseXpPerAttempt * Math.max(0.5, Math.min(3, performanceMultiplier)));
      }
      
      // Update user XP
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error(`Error updating XP for ${profile.username}:`, updateError);
        continue;
      }
      
      if (xp > 0) {
        console.log(`  ${profile.username}: ${xp} XP`);
      }
      migrated++;
    }
    
    console.log(`🎉 Successfully migrated XP for ${migrated}/${profiles.length} users!`);
    
    // Show top users by XP
    const { data: topUsers, error: topError } = await supabase
      .from('profiles')
      .select('username, xp')
      .gt('xp', 0)
      .order('xp', { ascending: false })
      .limit(10);
    
    if (!topError && topUsers.length > 0) {
      console.log('\n🏆 Top users by XP:');
      topUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username}: ${user.xp} XP`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateXp();
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

    console.log('Adding username and avatar_url columns to profiles table...');

    // Add username column
    const { error: usernameError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;`
    });

    if (usernameError) {
      console.error('Error adding username column:', usernameError);
    } else {
      console.log('✅ Username column added/verified');
    }

    // Add avatar_url column
    const { error: avatarError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`
    });

    if (avatarError) {
      console.error('Error adding avatar_url column:', avatarError);
    } else {
      console.log('✅ Avatar URL column added/verified');
    }

    console.log('Database update completed!');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
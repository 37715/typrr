import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

// Load environment variables
try {
  const envContent = await readFile('.env.local', 'utf-8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

console.log('Creating test user account...');

// Create a test user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123'
});

if (error) {
  console.error('Error creating user:', error);
} else {
  console.log('✅ Test user created:', data.user?.email);
  console.log('📧 Check your email for confirmation, or use email/password login');
  console.log('🔑 Email: test@example.com');
  console.log('🔑 Password: testpassword123');
}
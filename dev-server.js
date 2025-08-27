import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
try {
  const envContent = await readFile('.env.local', 'utf-8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Handle OPTIONS preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }
  next();
});

// Simple daily challenge endpoint implementation
app.get('/api/daily', async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    
    if (!url) return res.status(500).json({ error: 'supabaseUrl is required.' });
    if (!anon) return res.status(500).json({ error: 'supabaseAnonKey is required.' });
    
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    
    const today = new Date().toISOString().slice(0, 10); // UTC yyyy-mm-dd
    
    const { data: dc, error: e1 } = await supabase
      .from('daily_challenges')
      .select('challenge_date, snippet_id')
      .eq('challenge_date', today)
      .maybeSingle(); // This is the fix!
      
    if (e1) throw e1;
    if (!dc) return res.status(404).json({ error: 'no daily challenge' });

    const { data: snippet, error: e2 } = await supabase
      .from('snippets')
      .select('id, language, content')
      .eq('id', dc.snippet_id)
      .single();
      
    if (e2) throw e2;

    return res.status(200).json({ date: dc.challenge_date, snippet });
  } catch (err) {
    console.error('Daily challenge API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// Store typing attempts
app.post('/api/attempt', async (req, res) => {
  console.log('🎯 Attempt endpoint hit!', req.body);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url) return res.status(500).json({ error: 'supabaseUrl is required.' });
    if (!serviceKey) return res.status(500).json({ error: 'supabaseServiceKey is required.' });
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'unauthorized - no token' });
    }
    
    // Create client with anon key to verify user token
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.log('Auth error:', authError);
      return res.status(401).json({ error: 'unauthorized - invalid token' });
    }
    
    console.log('Authenticated user:', user.id);
    
    // Create service client for database operations
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { snippet_id, mode, wpm, accuracy, elapsed_ms } = req.body;
    
    // Validate required fields
    if (!snippet_id || !mode || wpm === undefined || accuracy === undefined || !elapsed_ms) {
      return res.status(400).json({ error: 'missing required fields' });
    }
    
    // Validate mode
    if (!['daily', 'practice'].includes(mode)) {
      return res.status(400).json({ error: 'invalid mode' });
    }
    
    // Insert attempt record - the trigger will automatically update user_stats
    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        snippet_id,
        mode,
        wpm: parseFloat(wpm),
        accuracy: parseFloat(accuracy),
        elapsed_ms: parseInt(elapsed_ms)
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert attempt error:', error);
      return res.status(500).json({ error: 'failed to store attempt' });
    }
    
    return res.status(200).json({ success: true, attempt_id: data.id });
    
  } catch (err) {
    console.error('Attempt API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

app.get('/api/leaderboard/daily', (req, res) => {
  res.status(200).json({ message: 'Daily leaderboard endpoint - placeholder' });
});

app.get('/api/leaderboard/alltime', (req, res) => {
  res.status(200).json({ message: 'All-time leaderboard endpoint - placeholder' });
});

app.get('/api/practice/random', async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    
    if (!url) return res.status(500).json({ error: 'supabaseUrl is required.' });
    if (!anon) return res.status(500).json({ error: 'supabaseAnonKey is required.' });
    
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    
    // Get language filter from query params
    const { language } = req.query;
    
    // Build query
    let query = supabase
      .from('snippets')
      .select('id, language, content')
      .eq('is_practice', true);
    
    // Add language filter if specified
    if (language && language !== 'all') {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'no practice snippets' });
    }
    
    // Pick a random snippet
    const pick = data[Math.floor(Math.random() * data.length)];
    return res.status(200).json({ snippet: pick });
    
  } catch (err) {
    console.error('Practice API error:', err);
    return res.status(500).json({ 
      error: err.message || 'server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📍 Test daily endpoint: http://localhost:${PORT}/api/daily`);
});
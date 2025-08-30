import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

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
} catch (err) {
  console.error('❌ Could not load .env.local:', err.message);
}

// Delete user handler inline
const handleDeleteUser = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  
  try {
    console.log('🗑️ Delete user API endpoint hit!', req.body);
    
    // Get auth token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'unauthorized - no token' });
    }
    
    // Use service role key for admin operations
    const { createClient } = await import('@supabase/supabase-js');
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
    
    // Verify the user token first
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: 'invalid token' });
    }
    
    const { user_id } = req.body;
    
    // Make sure user can only delete their own account
    if (user.id !== user_id) {
      return res.status(403).json({ error: 'forbidden - can only delete own account' });
    }
    
    console.log('Deleting user:', user_id);
    
    // Delete the user from auth.users table using admin client
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    
    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return res.status(500).json({ error: 'failed to delete user account', details: deleteError.message });
    }
    
    console.log('✅ User deleted successfully');
    return res.status(200).json({ 
      success: true, 
      message: 'user account deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      error: 'internal server error', 
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
};

// Import and handle API routes
async function loadApiRoutes() {
  try {
    console.log('🔄 Loading API routes...');
    
    // Add basic test route first
    app.get('/api/test', (req, res) => {
      res.json({ message: 'test route working' });
    });
    console.log('✅ Test route registered');
    
    // Add delete user route (inline handler)
    app.delete('/api/delete-user', handleDeleteUser);
    console.log('✅ Delete user route registered');
    
    try {
      // Import the daily challenge handler
      const dailyModule = await import('./api/daily.js');
      const dailyHandler = dailyModule.default;
      app.get('/api/daily', (req, res) => {
        dailyHandler(req, res);
      });
      console.log('✅ Daily challenge route registered');
    } catch (err) {
      console.error('❌ Failed to load daily route:', err.message);
    }
    
    try {
      // Import the random practice handler
      const randomModule = await import('./api/practice/random.js');
      const randomHandler = randomModule.default;
      app.get('/api/practice/random', (req, res) => {
        randomHandler(req, res);
      });
      console.log('✅ Random practice route registered');
    } catch (err) {
      console.error('❌ Failed to load random practice route:', err.message);
    }
    
    try {
      // Import the attempt handler
      const attemptModule = await import('./api/attempt.js');
      const attemptHandler = attemptModule.default;
      app.post('/api/attempt', (req, res) => {
        console.log('📝 Attempt route hit!');
        attemptHandler(req, res);
      });
      console.log('✅ Attempt route registered');
    } catch (err) {
      console.error('❌ Failed to load attempt route:', err.message);
    }
    
    // Try to load optional leaderboard routes
    try {
      const leaderboardDailyModule = await import('./api/leaderboard/daily.ts');
      const leaderboardAlltimeModule = await import('./api/leaderboard/alltime.ts');
      
      app.get('/api/leaderboard/daily', (req, res) => {
        leaderboardDailyModule.default(req, res);
      });
      
      app.get('/api/leaderboard/alltime', (req, res) => {
        leaderboardAlltimeModule.default(req, res);
      });
      console.log('✅ Leaderboard routes registered');
    } catch (err) {
      console.log('⚠️ Leaderboard routes not loaded (optional)');
    }
    
    // Try to load optional replays route
    try {
      const replayModule = await import('./api/replays/sign-url.ts');
      app.post('/api/replays/sign-url', (req, res) => {
        replayModule.default(req, res);
      });
      console.log('✅ Replays route registered');
    } catch (err) {
      console.log('⚠️ Replays route not loaded (optional)');
    }
    
    console.log('✅ All API routes loaded successfully');
  } catch (err) {
    console.error('❌ Critical error loading API routes:', err);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'dev server running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dev API server running on http://localhost:${PORT}`);
  loadApiRoutes();
});
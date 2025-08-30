import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

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

// Import and handle API routes
async function loadApiRoutes() {
  try {
    // Import the attempt handler
    const attemptModule = await import('./api/attempt.ts');
    const attemptHandler = attemptModule.default;
    
    // Import the daily challenge handler
    const dailyModule = await import('./api/daily.js');
    const dailyHandler = dailyModule.default;
    
    // Import the random practice handler
    const randomModule = await import('./api/practice/random.js');
    const randomHandler = randomModule.default;
    
    // Handle API routes
    app.post('/api/attempt', (req, res) => {
      attemptHandler(req, res);
    });
    
    app.get('/api/daily', (req, res) => {
      dailyHandler(req, res);
    });
    
    app.get('/api/practice/random', (req, res) => {
      randomHandler(req, res);
    });
    
    // Try to load leaderboard routes
    try {
      const leaderboardDailyModule = await import('./api/leaderboard/daily.ts');
      const leaderboardAlltimeModule = await import('./api/leaderboard/alltime.ts');
      
      app.get('/api/leaderboard/daily', (req, res) => {
        leaderboardDailyModule.default(req, res);
      });
      
      app.get('/api/leaderboard/alltime', (req, res) => {
        leaderboardAlltimeModule.default(req, res);
      });
    } catch (err) {
      console.log('⚠️ Leaderboard routes not loaded (optional)');
    }
    
    // Try to load replays route
    try {
      const replayModule = await import('./api/replays/sign-url.ts');
      app.post('/api/replays/sign-url', (req, res) => {
        replayModule.default(req, res);
      });
    } catch (err) {
      console.log('⚠️ Replays route not loaded (optional)');
    }
    
    console.log('✅ API routes loaded');
  } catch (err) {
    console.error('❌ Error loading API routes:', err);
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
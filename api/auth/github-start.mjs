import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { current_user_id, access_token } = req.body;
    
    if (!current_user_id || !access_token) {
      return res.status(400).json({ error: 'missing required parameters' });
    }

    // Verify the current user's session
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    
    if (userError || !user || user.id !== current_user_id) {
      return res.status(401).json({ error: 'invalid session' });
    }

    console.log('✅ User session verified for GitHub linking:', user.email);

    // Create a temporary OAuth session to get GitHub data
    // We'll store the original user ID in localStorage and retrieve it after OAuth
    const state = Buffer.from(JSON.stringify({ 
      original_user_id: current_user_id,
      timestamp: Date.now() 
    })).toString('base64');

    // Generate GitHub OAuth URL
    const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubOAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID || 'your_github_client_id');
    githubOAuthUrl.searchParams.set('redirect_uri', `${req.headers.origin || 'http://localhost:5173'}/api/auth/github-callback`);
    githubOAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubOAuthUrl.searchParams.set('state', state);
    githubOAuthUrl.searchParams.set('allow_signup', 'false'); // Don't create new GitHub accounts

    return res.status(200).json({
      success: true,
      oauth_url: githubOAuthUrl.toString(),
      message: 'redirect to github oauth'
    });

  } catch (error) {
    console.error('❌ GitHub OAuth start error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
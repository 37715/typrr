import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { action } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (action) {
      case 'start':
        return handleStart(req, res);
      case 'callback':
        return handleCallback(req, res);
      case 'connect':
        return handleConnect(req, res);
      case 'link':
        return handleLink(req, res);
      default:
        return res.status(400).json({ error: 'invalid action parameter' });
    }
  } catch (error) {
    console.error('❌ GitHub auth error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}

async function handleStart(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

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

  const state = Buffer.from(JSON.stringify({ 
    original_user_id: current_user_id,
    timestamp: Date.now() 
  })).toString('base64');

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID || 'your_github_client_id');
  githubOAuthUrl.searchParams.set('redirect_uri', `${req.headers.origin || 'http://localhost:5173'}/api/auth/github?action=callback`);
  githubOAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubOAuthUrl.searchParams.set('state', state);
  githubOAuthUrl.searchParams.set('allow_signup', 'false');

  return res.status(200).json({
    success: true,
    oauth_url: githubOAuthUrl.toString(),
    message: 'redirect to github oauth'
  });
}

async function handleCallback(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.status(400).json({ error: 'missing code or state' });
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { original_user_id } = stateData;

    if (!original_user_id) {
      return res.status(400).json({ error: 'invalid state data' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'failed to get access token' });
    }

    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    const githubUser = await userResponse.json();

    console.log('✅ GitHub user data received:', githubUser.login);

    // Check if this GitHub account is already linked to another user
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: existingLink } = await supabase
      .rpc('check_github_account_linkage', {
        github_user_id: githubUser.id.toString(),
        github_username: githubUser.login
      });

    if (existingLink && existingLink.length > 0 && existingLink[0].is_linked) {
      // GitHub account is already linked to another user
      const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}/profile`);
      errorUrl.searchParams.set('github_error', 'already_linked');
      errorUrl.searchParams.set('existing_user', existingLink[0].existing_username);
      return res.redirect(302, errorUrl.toString());
    }

    // Link GitHub account to the current user
    const linkResult = await supabase
      .rpc('link_github_to_existing_user', {
        user_id: original_user_id,
        github_user_id: githubUser.id.toString(),
        github_username: githubUser.login,
        github_avatar: githubUser.avatar_url || null
      });

    if (!linkResult.data) {
      const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}/profile`);
      errorUrl.searchParams.set('github_error', 'link_failed');
      return res.redirect(302, errorUrl.toString());
    }

    // Redirect back to frontend with success
    const redirectUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}/profile`);
    redirectUrl.searchParams.set('github_linked', 'true');
    redirectUrl.searchParams.set('github_username', githubUser.login);

    return res.redirect(302, redirectUrl.toString());

  } catch (error) {
    console.error('❌ GitHub callback error:', error);
    const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}/profile`);
    errorUrl.searchParams.set('github_error', 'callback_failed');
    return res.redirect(302, errorUrl.toString());
  }
}

async function handleConnect(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  // Implement connect logic here
  return res.status(200).json({ message: 'connect endpoint - implement as needed' });
}

async function handleLink(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  // Implement link logic here  
  return res.status(200).json({ message: 'link endpoint - implement as needed' });
}
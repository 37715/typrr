import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'missing authorization code' });
  }

  try {
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
    
    if (!githubUser.id) {
      return res.status(400).json({ error: 'failed to get GitHub user data' });
    }

    console.log('🔍 Checking GitHub account:', githubUser.login);

    // Check if this GitHub account is already linked
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
      // GitHub account is already linked - redirect to sign in instead
      console.log('⚠️ GitHub account already linked to:', existingLink[0].existing_username);
      
      const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}`);
      errorUrl.searchParams.set('auth_error', 'github_already_linked');
      errorUrl.searchParams.set('existing_user', existingLink[0].existing_username);
      
      return res.redirect(302, errorUrl.toString());
    }

    // GitHub account is not linked, proceed with Supabase GitHub OAuth
    console.log('✅ GitHub account available, proceeding with signup');
    
    // Create a Supabase auth session with GitHub
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${req.headers.origin || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (error) {
      console.error('Supabase GitHub auth error:', error);
      const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}`);
      errorUrl.searchParams.set('auth_error', 'supabase_github_failed');
      return res.redirect(302, errorUrl.toString());
    }

    // Redirect to Supabase GitHub OAuth
    return res.redirect(302, data.url);

  } catch (error) {
    console.error('❌ GitHub signup error:', error);
    const errorUrl = new URL(`${req.headers.origin || 'http://localhost:5173'}`);
    errorUrl.searchParams.set('auth_error', 'github_signup_failed');
    return res.redirect(302, errorUrl.toString());
  }
}
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    console.log('🔗 GitHub connect API endpoint hit');

    // Get the current user's session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'no authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Create regular client to verify user
    const supabaseUser = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Set the session from the token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Error verifying user:', userError);
      return res.status(401).json({ error: 'invalid or expired token' });
    }

    console.log('✅ User verified:', user.email);

    // Extract GitHub OAuth data from request body
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'no github oauth code provided' });
    }

    console.log('📝 Received GitHub OAuth code, exchanging for user info...');

    // Exchange the GitHub code for user info
    // Note: In a production app, you'd need to register a GitHub OAuth app and use its credentials
    const githubResponse = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        state: state
      }),
    });

    if (!githubResponse.ok) {
      console.error('❌ GitHub token exchange failed');
      return res.status(400).json({ error: 'github oauth failed' });
    }

    const tokenData = await githubResponse.json();
    
    if (tokenData.error) {
      console.error('❌ GitHub error:', tokenData.error_description);
      return res.status(400).json({ error: tokenData.error_description || 'github oauth error' });
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to fetch GitHub user info');
      return res.status(400).json({ error: 'failed to fetch github user info' });
    }

    const githubUser = await userResponse.json();
    console.log('👤 GitHub user info retrieved:', { id: githubUser.id, login: githubUser.login });

    // Check if this GitHub account is already linked to another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('github_id', githubUser.id.toString())
      .maybeSingle();

    if (existingProfile && existingProfile.id !== user.id) {
      return res.status(409).json({ 
        error: 'this github account is already connected to another devtyper account',
        existing_username: existingProfile.username 
      });
    }

    // Update the user's profile with GitHub info
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        github_id: githubUser.id.toString(),
        github_username: githubUser.login,
        github_avatar_url: githubUser.avatar_url,
        github_connected_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return res.status(500).json({ error: 'failed to update profile with github info' });
    }

    console.log('✅ GitHub account successfully connected');
    
    return res.status(200).json({
      success: true,
      github_username: githubUser.login,
      github_avatar_url: githubUser.avatar_url,
      message: 'github account connected successfully'
    });

  } catch (error) {
    console.error('❌ GitHub connect error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
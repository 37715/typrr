import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { code, state, error: githubError } = req.query;
    
    console.log('🔄 GitHub OAuth callback received');

    if (githubError) {
      console.error('❌ GitHub OAuth error:', githubError);
      return res.redirect(`/profile?github_error=${encodeURIComponent(githubError)}`);
    }

    if (!code || !state) {
      return res.redirect('/profile?github_error=missing_parameters');
    }

    // Decode the state to get original user ID
    let originalUserId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      originalUserId = stateData.original_user_id;
      
      // Check timestamp to prevent old/stale requests
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) { // 10 minutes
        throw new Error('OAuth state expired');
      }
    } catch (error) {
      console.error('❌ Invalid OAuth state:', error);
      return res.redirect('/profile?github_error=invalid_state');
    }

    console.log('📝 Exchanging GitHub code for access token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID || 'your_github_client_id',
        client_secret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret',
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ GitHub token exchange failed');
      return res.redirect('/profile?github_error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ GitHub token error:', tokenData.error_description);
      return res.redirect(`/profile?github_error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }

    console.log('👤 Fetching GitHub user data...');

    // Get GitHub user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to fetch GitHub user data');
      return res.redirect('/profile?github_error=failed_to_fetch_user');
    }

    const githubUser = await userResponse.json();
    console.log('✅ GitHub user data retrieved:', githubUser.login);

    // Use service role to update the original user's profile
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Check if this GitHub account is already linked to another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('github_id', githubUser.id.toString())
      .maybeSingle();

    if (existingProfile && existingProfile.id !== originalUserId) {
      console.log('⚠️ GitHub account already linked to another user');
      return res.redirect(`/profile?github_error=already_linked&existing_user=${encodeURIComponent(existingProfile.username)}`);
    }

    // Update the original user's profile with GitHub data
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        github_id: githubUser.id.toString(),
        github_username: githubUser.login,
        github_avatar_url: githubUser.avatar_url,
        github_connected_at: new Date().toISOString()
      })
      .eq('id', originalUserId);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return res.redirect('/profile?github_error=update_failed');
    }

    console.log('🎉 GitHub account successfully linked to existing user');
    return res.redirect('/profile?github_connected=success');

  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error);
    return res.redirect(`/profile?github_error=${encodeURIComponent('callback_error')}`);
  }
}
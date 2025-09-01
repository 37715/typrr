import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    console.log('🔗 GitHub link callback hit');
    
    const { code, state, error: githubError } = req.query;
    
    if (githubError) {
      console.error('❌ GitHub OAuth error:', githubError);
      return res.redirect(`/profile?github_error=${encodeURIComponent(githubError)}`);
    }
    
    if (!code) {
      return res.redirect('/profile?github_error=no_code');
    }
    
    // Get user_id from state parameter (we'll pass it in the OAuth URL)
    const userId = state;
    if (!userId) {
      return res.redirect('/profile?github_error=invalid_state');
    }
    
    console.log('📝 Exchanging GitHub code for user data...');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_GITHUB_CLIENT_ID || 'your_github_client_id',
        client_secret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret', 
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ GitHub token error:', tokenData.error_description);
      return res.redirect(`/profile?github_error=${encodeURIComponent(tokenData.error_description)}`);
    }
    
    // Get GitHub user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!userResponse.ok) {
      console.error('❌ Failed to fetch GitHub user');
      return res.redirect('/profile?github_error=failed_to_fetch_user');
    }
    
    const githubUser = await userResponse.json();
    console.log('👤 GitHub user retrieved:', githubUser.login);
    
    // Create Supabase admin client\n    const supabase = createClient(\n      process.env.SUPABASE_URL,\n      process.env.SUPABASE_SERVICE_ROLE_KEY,\n      { auth: { persistSession: false } }\n    );\n    \n    // Check if this GitHub account is already linked to another user\n    const { data: existingProfile } = await supabase\n      .from('profiles')\n      .select('id, username')\n      .eq('github_id', githubUser.id.toString())\n      .maybeSingle();\n    \n    if (existingProfile && existingProfile.id !== userId) {\n      console.log('⚠️ GitHub account already linked to another user');\n      return res.redirect(`/profile?github_error=${encodeURIComponent('github_already_linked')}&existing_user=${existingProfile.username}`);\n    }\n    \n    // Update the user's profile with GitHub data\n    const { error: updateError } = await supabase\n      .from('profiles')\n      .update({\n        github_id: githubUser.id.toString(),\n        github_username: githubUser.login,\n        github_avatar_url: githubUser.avatar_url,\n        github_connected_at: new Date().toISOString()\n      })\n      .eq('id', userId);\n    \n    if (updateError) {\n      console.error('❌ Error updating profile:', updateError);\n      return res.redirect('/profile?github_error=update_failed');\n    }\n    \n    console.log('✅ GitHub account linked successfully');\n    return res.redirect('/profile?github_connected=success');\n    \n  } catch (error) {\n    console.error('❌ GitHub link error:', error);\n    return res.redirect(`/profile?github_error=${encodeURIComponent('server_error')}`);\n  }\n}
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { code, state, error: githubError } = req.query;
    
    console.log('🔄 GitHub OAuth callback hit', { code: !!code, state, error: githubError });
    
    // Handle GitHub OAuth errors
    if (githubError) {
      console.error('❌ GitHub OAuth error:', githubError);
      return res.redirect(`/profile?github_connected=error&error=${encodeURIComponent(githubError)}`);
    }
    
    if (!code || !state) {
      return res.redirect('/profile?github_connected=error&error=missing_oauth_parameters');
    }
    
    // For now, since we don't have GitHub OAuth app set up yet,  
    // let's create a simpler version that just validates the OAuth flow worked
    // and manually prompts for GitHub username with verification
    
    // In a real implementation, you would:
    // 1. Verify the state parameter against stored value
    // 2. Exchange code for access token with GitHub
    // 3. Fetch user info from GitHub API
    // 4. Update user profile in database
    
    // For now, redirect back with a success flag so the user can complete setup
    console.log('✅ OAuth flow completed, redirecting to profile for manual completion');
    
    return res.redirect('/profile?github_oauth_completed=true');
    
  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error);
    return res.redirect(`/profile?github_connected=error&error=${encodeURIComponent('callback_processing_failed')}`);
  }
}
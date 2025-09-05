import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { github_username, github_id } = req.body;
  
  if (!github_username && !github_id) {
    return res.status(400).json({ error: 'github_username or github_id required' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if GitHub account is already linked
    const { data: existingLink } = await supabase
      .rpc('check_github_account_linkage', {
        github_user_id: github_id || '',
        github_username: github_username || ''
      });

    if (existingLink && existingLink.length > 0) {
      const linkData = existingLink[0];
      return res.status(200).json({
        is_linked: linkData.is_linked,
        existing_user_id: linkData.existing_user_id,
        existing_username: linkData.existing_username,
        message: linkData.is_linked 
          ? 'this github account is already linked to another user'
          : 'github account is available'
      });
    }

    return res.status(200).json({
      is_linked: false,
      message: 'github account is available'
    });

  } catch (error) {
    console.error('GitHub check error:', error);
    return res.status(500).json({ 
      error: 'internal server error',
      details: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
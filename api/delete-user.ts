import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const supabase = createClient(
      process.env.SUPABASE_URL as string, 
      process.env.SUPABASE_SERVICE_ROLE_KEY as string, 
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
}
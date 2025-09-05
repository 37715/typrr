import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>('/profile');
  const toast = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle Supabase auth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          
          // Check for specific GitHub auth errors
          if (authError.message.includes('github_already_linked')) {
            setError('this github account is already linked to another user. please sign in to that account instead.');
            return;
          }
          
          setError(`authentication failed: ${authError.message}`);
          return;
        }

        if (data.session?.user) {
          console.log('✅ User authenticated successfully:', data.session.user.email);
          
          // Check if this is a new user with GitHub data
          const githubData = data.session.user.user_metadata;
          if (githubData?.provider === 'github') {
            console.log('🔗 GitHub user authenticated:', githubData.user_name || githubData.preferred_username);
          }
          
          // Check URL params for additional context
          const from = searchParams.get('from');
          const authMode = searchParams.get('auth_mode');
          
          if (from === 'oauth') {
            toast({ 
              variant: 'success', 
              title: 'authentication successful',
              description: 'welcome to devtyper!'
            });
          }
          
          // Redirect to appropriate page
          setRedirectPath('/profile');
        } else {
          // No session established
          const errorParam = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (errorParam) {
            setError(`authentication error: ${errorDescription || errorParam}`);
          } else {
            setError('authentication failed - no session established');
          }
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        setError('unexpected error during authentication');
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, toast]);

  if (processing) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900\">
        <div className=\"text-center\">
          <Loader2 className=\"w-8 h-8 animate-spin mx-auto mb-4 text-blue-600\" />
          <h2 className=\"text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2\">
            completing authentication...
          </h2>
          <p className=\"text-zinc-600 dark:text-zinc-400\">
            please wait while we sign you in
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900\">
        <div className=\"max-w-md p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg text-center\">
          <div className=\"w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4\">
            <span className=\"text-2xl\">⚠️</span>
          </div>
          <h2 className=\"text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2\">
            authentication failed
          </h2>
          <p className=\"text-zinc-600 dark:text-zinc-400 mb-4\">
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\"
          >
            return to homepage
          </button>
        </div>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
};
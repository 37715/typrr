import React, { useEffect } from 'react';
import { Heart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DonationSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <Heart className="w-6 h-6 text-red-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 lowercase">thank you!</h1>
        
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6 lowercase">
          your donation helps keep typrr fast, clean, and ad-free for everyone
        </p>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8 lowercase">
          you'll receive a confirmation email shortly
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-xl font-medium lowercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          back to typing
        </button>
        
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4 lowercase">
          redirecting automatically in 5 seconds...
        </p>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Trophy, User, Settings } from 'lucide-react';
import GlassAuthModal from '@/components/ui/auth-model';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LeaderboardModal } from '@/components/ui/leaderboard-modal';
import { SettingsModal } from '@/components/ui/settings-modal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { useFontSettings } from '@/hooks/useFontSettings';

export const Header: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dailyData, setDailyData] = useState([]);
  const [trickyData, setTrickyData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const toast = useToast();
  const { fontFamily, changeFontFamily } = useFontSettings();

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      // Detect current page
      const isTrickyChars = window.location.pathname.includes('tricky-chars');
      const mode = isTrickyChars ? 'tricky-chars' : 'daily';
      
      const response = await fetch(`/api/leaderboard?mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.leaderboard?.map((entry: any) => {
          return {
            id: entry.user_id,
            username: entry.username,
            avatarUrl: entry.avatar_url,
            wpm: entry.wpm,
            accuracy: entry.accuracy,
            timeMs: entry.elapsed_ms,
            totalAttempts: entry.total_attempts,
            totalXp: entry.total_xp || 150
          };
        }) || [];
        
        if (isTrickyChars) {
          setTrickyData(formattedData);
        } else {
          setDailyData(formattedData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleLeaderboardOpen = () => {
    setLbOpen(true);
    fetchLeaderboard();
  };

  useEffect(() => {
    // detect session on load and subscribe to changes (works after OAuth redirect)
    supabase.auth.getUser().then(({ data }) => {
      const authed = !!data.user;
      setIsSignedIn(authed);
      // If returning from OAuth (code in URL) and authenticated, show success and clean URL
      const params = new URLSearchParams(window.location.search);
      const fromOauth = params.get('from') === 'oauth';
      if (fromOauth && authed) {
        toast({ variant: 'success', title: 'signed in' });
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
      } else if (fromOauth && !authed) {
        toast({ variant: 'error', title: 'sign in failed', description: 'please try again' });
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
        setAuthOpen(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session?.user;
      setIsSignedIn(authed);
      if (authed) {
        // close modal but avoid redirect/toast spam on normal navigation
        setAuthOpen(false);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  return (
    <header className="w-full lowercase bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-zinc-500 rounded-lg transition-colors duration-200 hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900"
              aria-label="settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <span className="text-white dark:text-zinc-900 font-bold text-sm">tr</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">typrr</h1>
            <ThemeToggle className="ml-2" />
          </div>
          
          {/* top navigation tabs */}
          <nav className="hidden md:flex items-center justify-center space-x-1">
            <a href="/daily" className="px-4 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 whitespace-nowrap">
              daily challenge
            </a>
            <a href="/practice" className="px-4 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 whitespace-nowrap">
              practice
            </a>
            <a href="/tricky-chars" className="px-4 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 whitespace-nowrap">
              tricky chars
            </a>
          </nav>

          <div className="flex items-center space-x-2 justify-end">
            <button onClick={handleLeaderboardOpen} className="p-2 text-zinc-500 rounded-lg transition-colors duration-200 hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900" aria-label="trophies">
              <Trophy className="w-5 h-5" />
            </button>
            <a
              href="/profile"
              onClick={async (e) => {
                e.preventDefault();
                const { data } = await supabase.auth.getUser();
                if (data.user) {
                  window.location.href = '/profile';
                } else {
                  setAuthOpen(true);
                }
              }}
              className="p-2 text-zinc-500 rounded-lg transition-colors duration-200 hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900"
              aria-label="profile"
            >
              <User className="w-5 h-5" />
            </a>
            <GlassAuthModal
              open={authOpen}
              onOpenChange={setAuthOpen}
              onLogin={() => setAuthOpen(false)}
              onSignup={() => setAuthOpen(false)}
            />
            <LeaderboardModal 
              open={lbOpen} 
              onOpenChange={setLbOpen} 
              daily={window.location.pathname.includes('tricky-chars') ? trickyData : dailyData}
              loading={loadingLeaderboard}
            />
            <SettingsModal
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              fontFamily={fontFamily}
              onFontChange={changeFontFamily}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
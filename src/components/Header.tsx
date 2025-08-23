import React, { useState } from 'react';
import { Trophy, User } from 'lucide-react';
import GlassAuthModal from '@/components/ui/auth-model';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const Header: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  return (
    <header className="w-full lowercase bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <span className="text-white dark:text-zinc-900 font-bold text-sm">tr</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">typrr</h1>
            <ThemeToggle className="ml-2" />
          </div>
          
          {/* top navigation tabs */}
          <nav className="hidden md:flex items-center justify-center space-x-2">
            <a href="/daily" className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors duration-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-900">
              daily challenge
            </a>
            <a href="/practice" className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors duration-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-900">
              practice
            </a>
          </nav>

          <div className="flex items-center space-x-2 justify-end">
            <button className="p-2 text-zinc-500 rounded-lg transition-colors duration-200 hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900" aria-label="trophies">
              <Trophy className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (!isSignedIn) setAuthOpen(true);
              }}
              className="p-2 text-zinc-500 rounded-lg transition-colors duration-200 hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900"
              aria-label="profile"
            >
              <User className="w-5 h-5" />
            </button>
            <GlassAuthModal
              open={authOpen}
              onOpenChange={setAuthOpen}
              onLogin={() => {
                setIsSignedIn(true);
                setAuthOpen(false);
              }}
              onSignup={() => {
                setIsSignedIn(true);
                setAuthOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
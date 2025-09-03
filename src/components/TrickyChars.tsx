import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Trophy, Hash } from 'lucide-react';
import { GetStartedButton } from '@/components/ui/get-started-button';
import { LeaderboardModal } from '@/components/ui/leaderboard-modal';
import GlassAuthModal from '@/components/ui/auth-model';
import { supabase } from '@/lib/supabase';

interface TrickyCharsProps {
  onComplete?: () => void;
  onStart?: () => void;
  onReset?: () => void;
  onRefresh?: () => void;
}

const TRICKY_CHARS = [
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=',
  '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', 
  ',', '.', '?', '/', '~', '`', '_'
];

const generateTrickySequence = (length: number = 30): string => {
  let sequence = '';
  for (let i = 0; i < length; i++) {
    const randomChar = TRICKY_CHARS[Math.floor(Math.random() * TRICKY_CHARS.length)];
    sequence += randomChar;
    // Add occasional spaces for breathing room (less frequently)
    if (i > 0 && i % 10 === 0 && Math.random() > 0.8) {
      sequence += ' ';
      i++; // Count the space
    }
  }
  return sequence;
};

export const TrickyChars: React.FC<TrickyCharsProps> = ({
  onComplete,
  onStart,
  onReset,
  onRefresh,
}) => {
  const [charSequence, setCharSequence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showXpMessage, setShowXpMessage] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [trickyData, setTrickyData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimestampRef = useRef<number>(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);

  // Generate initial sequence and ensure focus
  useEffect(() => {
    setCharSequence(generateTrickySequence(30));
    // Auto-focus after a brief delay to ensure component is mounted
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  // Maintain focus when component updates
  useEffect(() => {
    if (!isComplete) {
      textareaRef.current?.focus();
    }
  }, [charSequence, isComplete]);

  // Re-focus when clicking anywhere on the typing area
  const handleContainerClick = () => {
    if (!isComplete) {
      textareaRef.current?.focus();
    }
  };

  // Calculate typing metrics
  const totalCharsTyped = userInput.length;
  const totalWordsTyped = useMemo(() => totalCharsTyped / 5, [totalCharsTyped]);
  const wpm = useMemo(() => {
    if (!hasStarted || startTimestampRef.current === 0) return 0;
    const elapsedMinutes = (performance.now() - startTimestampRef.current) / 60000;
    // Prevent extremely high WPM from tiny elapsed times
    if (elapsedMinutes < 0.01) return 0; // Wait at least 0.6 seconds before calculating
    return totalWordsTyped / elapsedMinutes;
  }, [totalWordsTyped, hasStarted]);

  const accuracy = useMemo(() => {
    if (totalKeysPressed === 0) return 100;
    return Math.max(0, ((totalKeysPressed - totalMistakes) / totalKeysPressed) * 100);
  }, [totalMistakes, totalKeysPressed]);

  // Check for authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    
    return () => sub.subscription.unsubscribe();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Don't allow typing beyond the sequence length
    if (value.length > charSequence.length) return;
    
    // Start timing on first keystroke
    if (!hasStarted && value.length > 0) {
      setHasStarted(true);
      startTimestampRef.current = performance.now();
      onStart?.();
    }

    // Count mistakes
    if (value.length > userInput.length) {
      setTotalKeysPressed(prev => prev + 1);
      const newCharIndex = value.length - 1;
      if (value[newCharIndex] !== charSequence[newCharIndex]) {
        setTotalMistakes(prev => prev + 1);
      }
    }

    setUserInput(value);
  };

  // Check for completion
  useEffect(() => {
    if (charSequence.length > 0 && userInput.length === charSequence.length && userInput === charSequence) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [userInput, charSequence, onComplete]);

  // Submit attempt when complete
  useEffect(() => {
    if (!isComplete || !hasStarted || !isLoggedIn) return;

    const submit = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) return;

        const attemptData = { 
          snippet_id: '4785fbf4-d7a9-422a-8384-1d8ac804fd2d', // Placeholder snippet for tricky chars mode
          mode: 'tricky_chars',
          elapsed_ms: Math.round((performance.now() - startTimestampRef.current)), 
          wpm: Math.round(wpm), 
          accuracy: Math.round(accuracy * 100) / 100 // accuracy is already a percentage
        };
        
        console.log('Submitting tricky chars attempt:', attemptData);
        
        const response = await fetch('/api/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(attemptData)
        });
        
        const result = await response.json();
        console.log('Attempt response:', result);
        
        // Show XP gained - lower amount for tricky chars
        const earnedXp = Math.round(Math.max(5, Math.min(10, Math.round(wpm * (accuracy / 100) * 0.2))));
        setXpGained(earnedXp);
        setShowXpMessage(true);
        
        // Hide XP message after 4 seconds
        setTimeout(() => setShowXpMessage(false), 4000);
      } catch (error) {
        console.error('Error submitting tricky chars attempt:', error);
      }
    };
    submit();
  }, [isComplete, hasStarted, isLoggedIn, wpm, accuracy]);

  // Handle refresh/reset
  const handleRefresh = () => {
    setCharSequence(generateTrickySequence(30));
    setUserInput('');
    setHasStarted(false);
    setIsComplete(false);
    setTotalMistakes(0);
    setTotalKeysPressed(0);
    setXpGained(null);
    setShowXpMessage(false);
    startTimestampRef.current = 0;
    // Focus after state updates
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
    onRefresh?.();
  };

  const fetchTrickyLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const response = await fetch('/api/leaderboard?mode=tricky-chars');
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.leaderboard?.map((entry: any) => ({
          id: entry.user_id,
          username: entry.username,
          avatarUrl: entry.avatar_url,
          wpm: entry.wpm,
          accuracy: entry.accuracy,
          timeMs: entry.elapsed_ms,
          totalAttempts: entry.total_attempts,
          totalXp: entry.total_xp || 150
        })) || [];
        setTrickyData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch tricky chars leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleLeaderboardOpen = () => {
    setLbOpen(true);
    fetchTrickyLeaderboard();
  };

  // Render each character with color coding
  const renderSequence = () => {
    return charSequence.split('').map((char, index) => {
      let className = 'inline-block transition-all duration-100 ';
      
      if (index < userInput.length) {
        // Typed characters
        if (userInput[index] === char) {
          className += 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
        } else {
          className += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (index === userInput.length) {
        // Current character
        className += 'text-zinc-900 dark:text-white bg-blue-200 dark:bg-blue-800/50 animate-pulse';
      } else {
        // Upcoming characters
        className += 'text-zinc-400 dark:text-zinc-500';
      }

      return (
        <span key={index} className={`${className} px-1 py-0.5 rounded text-4xl font-mono`}>
          {char === ' ' ? '␣' : char}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto lowercase relative">
      <div className="text-center text-zinc-700 dark:text-zinc-300 mb-3">tricky chars challenge</div>
      <div className="pointer-events-none absolute -inset-x-8 -inset-y-6 rounded-[2rem] bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-purple-500/15 blur-3xl" />
      
      <div className={`bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl border shadow-2xl overflow-hidden transition-all duration-300 relative cursor-text ${
        isFocused ? 'border-blue-400 dark:border-blue-500 shadow-blue-500/20' : 'border-zinc-200 dark:border-zinc-800'
      }`} onClick={handleContainerClick}>
        {/* Header with stats */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 transition-colors duration-300">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400 mb-1">speed</div>
              <div className="text-2xl font-mono text-zinc-900 dark:text-white">
                {Math.round(wpm)} wpm
              </div>
            </div>
            <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-600"></div>
            <div className="text-center">
              <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400 mb-1">accuracy</div>
              <div className="text-2xl font-mono text-zinc-900 dark:text-white">
                {accuracy !== null ? `${accuracy.toFixed(0)}%` : '-'}
              </div>
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
            <span className="lowercase">tricky chars</span>
          </div>
        </div>

        {/* Character sequence display */}
        <div className="relative">
          <div className="p-8 bg-gradient-to-b from-zinc-100/50 to-white dark:from-zinc-800/50 dark:to-zinc-900">
            {/* Instruction text when not started */}
            {!hasStarted && (
              <div className="text-center mb-4 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
                start typing to begin the challenge
              </div>
            )}
            <div className="text-center leading-relaxed select-none whitespace-nowrap overflow-x-auto" style={{ lineHeight: '1.8' }}>
              {renderSequence()}
            </div>
          </div>

          {/* Textarea for input */}
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 w-full h-full bg-transparent border-none outline-none resize-none text-transparent"
            style={{ caretColor: 'transparent' }}
            disabled={isComplete}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            autoFocus
          />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-white/40 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="group relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-800 text-white hover:bg-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 px-8 py-3 text-sm font-medium"
            >
              <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
                new sequence
              </span>
              <i className="absolute right-1 top-1 bottom-1 rounded-xl z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
              </i>
            </button>
            <button
              onClick={handleLeaderboardOpen}
              className="group relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-800 text-white hover:bg-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 px-8 py-3 text-sm font-medium"
            >
              <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
                leaderboard
              </span>
              <i className="absolute right-1 top-1 bottom-1 rounded-xl z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                <Trophy size={16} strokeWidth={2} aria-hidden="true" />
              </i>
            </button>
          </div>
        </div>
      </div>

      {/* Completion messages */}
      {!isLoggedIn && isComplete && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border lowercase bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
            <span className="text-sm">
              <button 
                onClick={() => setAuthOpen(true)}
                className="underline hover:no-underline cursor-pointer"
              >
                sign in
              </button> to compete on the leaderboard
            </span>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="mt-3 text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border lowercase bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
            <Hash size={16} />
            <span className="text-base font-medium">sequence complete!</span>
          </div>
          
          {showXpMessage && isLoggedIn && xpGained && (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border lowercase bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20">
                <span className="text-sm font-medium">+{xpGained} xp earned</span>
              </div>
            </div>
          )}
        </div>
      )}

      <LeaderboardModal 
        open={lbOpen} 
        onOpenChange={setLbOpen} 
        daily={trickyData} 
        loading={leaderboardLoading}
      />
      <GlassAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLogin={() => setAuthOpen(false)}
        onSignup={() => setAuthOpen(false)}
      />
    </div>
  );
};
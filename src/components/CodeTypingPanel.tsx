import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { GetStartedButton } from '@/components/ui/get-started-button';
import { LeaderboardModal } from '@/components/ui/leaderboard-modal';
import { LanguageFilterDropdown } from '@/components/ui/language-filter-dropdown';
import { supabase } from '@/lib/supabase';

interface CodeTypingPanelProps {
  snippet: string;
  snippetId: string | null;
  onComplete: () => void;
  onStart: () => void;
  onReset: () => void;
  onRefresh: () => void;
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

export const CodeTypingPanel: React.FC<CodeTypingPanelProps> = ({
  snippet,
  snippetId,
  onComplete,
  onStart,
  onReset,
  onRefresh,
  selectedLanguage = 'all',
  onLanguageChange,
}) => {
  const [userInput, setUserInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showXpMessage, setShowXpMessage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const snippetLines = snippet.split('\n');
  const isDailyMode = typeof window !== 'undefined' && !window.location.pathname.includes('practice');
  const todayKey = useMemo(() => {
    const d = new Date();
    const iso = d.toISOString().slice(0, 10);
    return `typrr_daily_attempts_${iso}`;
  }, []);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [attemptRecorded, setAttemptRecorded] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [dailyData, setDailyData] = useState([]);
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    try {
      return localStorage.getItem('typrr_auto_next') === '1';
    } catch { return false; }
  });

  const startTimestampRef = useRef<number>(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);
  
  const totalCharsTyped = userInput.length;
  const totalWordsTyped = useMemo(() => totalCharsTyped / 5, [totalCharsTyped]);
  const wpm = useMemo(() => {
    if (!hasStarted || startTimestampRef.current === 0) return 0;
    const elapsedMinutes = (performance.now() - startTimestampRef.current) / 60000;
    if (elapsedMinutes <= 0) return 0;
    return totalWordsTyped / elapsedMinutes;
  }, [totalWordsTyped, hasStarted]);

  // Calculate accuracy as percentage of correct first-attempt keystrokes
  const accuracy = useMemo(() => {
    if (!hasStarted || totalKeysPressed === 0) return null; // Show "-" before typing starts
    const correctKeys = totalKeysPressed - totalMistakes;
    return Math.max(0, (correctKeys / totalKeysPressed) * 100);
  }, [totalKeysPressed, totalMistakes, hasStarted]);

  const hasMistake = useMemo(() => {
    for (let i = 0; i < userInput.length; i += 1) {
      if (userInput[i] !== snippet[i]) return true;
    }
    return false;
  }, [userInput, snippet]);

  useEffect(() => {
    if (userInput.length === snippet.length && userInput === snippet) {
      setIsComplete(true);
      onComplete();
    }
  }, [userInput, snippet, onComplete]);

  useEffect(() => {
    // Reset state when snippet changes only
    setUserInput('');
    setHasStarted(false);
    setIsComplete(false);
    setTotalMistakes(0);
    setTotalKeysPressed(0);
    startTimestampRef.current = 0;
    onReset();

    // Focus the textarea and set focused state
    if (textareaRef.current) {
      textareaRef.current.focus();
      setIsFocused(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippet]);

  // Auto-focus on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  // Handle input changes and track keystrokes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Normalize Windows CRLF to LF to match snippet formatting
    const newValue = e.target.value.replace(/\r\n/g, '\n');
    const prevLength = userInput.length;
    const newLength = newValue.length;
    
    // Start timer on first keystroke
    if (!hasStarted && newLength > 0) {
      setHasStarted(true);
      startTimestampRef.current = performance.now();
      onStart();
    }
    
    // Prevent typing beyond the snippet length
    if (newLength > snippet.length) return;
    
    // Count keystrokes only when adding characters (not deleting)
    if (newLength > prevLength) {
      const keysAdded = newLength - prevLength;
      setTotalKeysPressed(prev => prev + keysAdded);
      
      // Check if any of the newly added characters are incorrect
      let mistakes = 0;
      for (let i = prevLength; i < newLength; i++) {
        if (i < snippet.length && newValue[i] !== snippet[i]) {
          mistakes++;
        }
      }
      if (mistakes > 0) {
        setTotalMistakes(prev => prev + mistakes);
      }
    }
    
    setUserInput(newValue);
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    
    checkAuth();
    
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    
    return () => sub.subscription.unsubscribe();
  }, []);

  // Initialize attempts from localStorage for daily mode
  useEffect(() => {
    if (!isDailyMode) return;
    const raw = localStorage.getItem(todayKey);
    const val = raw ? parseInt(raw, 10) : 3;
    if (Number.isNaN(val)) {
      setAttemptsRemaining(3);
      localStorage.setItem(todayKey, '3');
    } else {
      setAttemptsRemaining(val);
    }
  }, [isDailyMode, todayKey]);

  // When a daily attempt completes once, decrement
  useEffect(() => {
    if (!isDailyMode) return;
    if (!isComplete) return;
    if (attemptRecorded) return;
    setAttemptRecorded(true);
    setAttemptsRemaining(prev => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem(todayKey, String(next));
      return next;
    });
  }, [isComplete, attemptRecorded, isDailyMode, todayKey]);

  const fetchDailyLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/daily');
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
          totalXp: entry.total_xp || (entry.total_attempts ? (entry.total_attempts * 5) * ((entry.wpm * (entry.accuracy || 100) / 100) / 50) : 150)
        })) || [];
        setDailyData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch daily leaderboard:', error);
    }
  };

  const handleLeaderboardOpen = () => {
    setLbOpen(true);
    fetchDailyLeaderboard();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Preserve typing within snippet length and support Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selectionStart = textarea.selectionStart ?? userInput.length;
      const selectionEnd = textarea.selectionEnd ?? userInput.length;
      const insertion = '  ';
      const nextValue =
        (userInput.slice(0, selectionStart) + insertion + userInput.slice(selectionEnd)).replace(/\r\n/g, '\n');

      if (!hasStarted) {
        setHasStarted(true);
        onStart();
      }

      if (nextValue.length <= snippet.length) {
        setUserInput(nextValue);
        // Restore caret after React state update
        requestAnimationFrame(() => {
          const nextPos = selectionStart + insertion.length;
          textarea.setSelectionRange(nextPos, nextPos);
        });
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorIndex = textarea.selectionStart ?? userInput.length;

      if (!hasStarted) {
        setHasStarted(true);
        onStart();
      }

      // Insert the newline and proper indentation based on the target snippet
      if (snippet[cursorIndex] === '\n') {
        let indent = '';
        let j = cursorIndex + 1;
        while (j < snippet.length && (snippet[j] === ' ' || snippet[j] === '\t')) {
          indent += snippet[j];
          j += 1;
        }

        const insertion = '\n' + indent;
        const selectionStart = textarea.selectionStart ?? userInput.length;
        const selectionEnd = textarea.selectionEnd ?? userInput.length;
        const nextValue = (
          userInput.slice(0, selectionStart) + insertion + userInput.slice(selectionEnd)
        ).replace(/\r\n/g, '\n');

        if (nextValue.length <= snippet.length) {
          setUserInput(nextValue);
          requestAnimationFrame(() => {
            const nextPos = selectionStart + insertion.length;
            textarea.setSelectionRange(nextPos, nextPos);
          });
        }
      }
    }

    // Enhanced key handling for IDE-like behavior
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorIndex = textarea.selectionStart ?? userInput.length;
    
    // Handle space key - prevent skipping newlines but allow wrong spaces
    if (e.key === ' ') {
      // If next expected character is newline, prevent space
      if (snippet[cursorIndex] === '\n') {
        e.preventDefault();
        return;
      }
    }
    
    // Prevent skipping newlines with regular characters
    else if (e.key.length === 1 && e.key !== '\n') {
      // If we're at a newline position and user is typing a regular character, prevent it
      if (snippet[cursorIndex] === '\n') {
        e.preventDefault();
        return;
      }
      
      // Allow typing wrong characters - they will be highlighted in red
      // No need to prevent typing - just let it through for visual feedback
    }
  };

  // Temporarily disable to test jumping
  // const isAtEndOfLine = useMemo(() => {
  //   const cursorPos = userInput.length;
  //   if (cursorPos >= snippet.length) return false;
  //   
  //   // Check if next character is newline or we're at the end
  //   return snippet[cursorPos] === '\n';
  // }, [userInput.length, snippet]);

  // Helper function to check if current line is completed (all chars typed except newline)
  const isLineCompleted = useMemo(() => {
    const cursorPos = userInput.length;
    if (cursorPos >= snippet.length) return false;
    
    // Must be at a newline position to show enter indicator
    if (snippet[cursorPos] !== '\n') return false;
    
    // Find the start of current line
    let lineStart = cursorPos;
    while (lineStart > 0 && snippet[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    // Check if all characters from line start to cursor are typed correctly
    for (let i = lineStart; i < cursorPos; i++) {
      if (userInput[i] !== snippet[i]) return false;
    }
    
    // Show enter hint when:
    // 1. Line is empty (blank line) - cursorPos === lineStart
    // 2. All characters on line are typed correctly - cursorPos > lineStart
    return true; // We've already verified we're at a newline and all chars are correct
  }, [userInput, snippet]);

  // Calculate enter hint position - fixed distance from cursor
  const enterHintPosition = useMemo(() => {
    if (!isLineCompleted || !isFocused || isComplete) return null;
    
    const lines = userInput.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineLength = lines[currentLineIndex]?.length || 0;
    
    return {
      left: `${64 + currentLineLength * 9.6 + 30}px`, // Fixed 30px offset from cursor
      top: `${32 + currentLineIndex * 28}px`
    };
  }, [isLineCompleted, isFocused, isComplete, userInput]);

  const renderCharacter = (char: string, index: number) => {
    const userChar = userInput[index];
    let className = 'relative';

    // avoid highlighting leading indentation until first non-space char on each line
    const isLeadingIndent = (() => {
      if (char !== ' ' && char !== '\t') return false;
      // check if this is at the start of a line
      if (index === 0) return true;
      const prev = snippet[index - 1];
      if (prev === '\n') return true;
      // if previous chars back to the last newline are all spaces/tabs, this is still leading indent
      let k = index - 1;
      while (k >= 0 && snippet[k] !== '\n') {
        if (snippet[k] !== ' ' && snippet[k] !== '\t') return false;
        k--;
      }
      return true;
    })();

    if (index < userInput.length) {
      if (userChar === char) {
        className += isLeadingIndent ? '' : ' dark:text-green-300 dark:bg-green-500/20 text-emerald-700 bg-emerald-200/40';
      } else {
        className += isLeadingIndent ? '' : ' dark:text-red-300 dark:bg-red-500/30 text-rose-700 bg-rose-200/50';
      }
    } else if (index === userInput.length) {
      // Enhanced cursor visibility - always show when focused with pulsing animation
      if (isFocused && !isComplete) {
        className += ' dark:bg-blue-500/40 bg-blue-500/40 animate-pulse';
      } else {
        className += ' dark:bg-gray-500/10 bg-zinc-300/20';
      }
    } else {
      className += ' dark:text-gray-400 text-zinc-500';
    }

    // Fixed cursor handling - consistent rendering for all characters
    if (index === userInput.length && isFocused && !isComplete) {
      // Special handling for newlines to make cursor visible on empty lines
      if (char === '\n') {
        return (
          <span key={index} className={className + ' relative'}>
            {char}
            {/* Add a visible cursor indicator for newlines */}
            <span className="absolute left-0 top-0 w-2 h-6 bg-blue-500/40 animate-pulse pointer-events-none" />
          </span>
        );
      }
      
      // Use same structure for other characters
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    }

    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char === '\n' ? char : char}
      </span>
    );
  };

  const handleRefresh = () => {
    onRefresh();
  };

  // Calculate XP gained for this attempt
  const calculateXpGained = (wpmValue: number, accuracyValue: number) => {
    const baseXpPerAttempt = 5; // Base XP per challenge
    const performanceMultiplier = (wpmValue * (accuracyValue / 100)) / 50; // Normalize to ~1-3x multiplier
    return Math.round(baseXpPerAttempt * Math.max(1, performanceMultiplier));
  };

  // Submit attempt to server when complete
  useEffect(() => {
    console.log('isComplete changed to:', isComplete);
    if (!isComplete) return;
    
    const submit = async () => {
      try {
        console.log('Starting attempt submission...');
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        console.log('Auth session:', session.session ? 'Found' : 'Not found');
        console.log('Token:', token ? 'Present' : 'Missing');
        
        // Use our new non-recoverable accuracy calculation
        const finalAccuracy = accuracy !== null ? accuracy : 0;
        const mode = isDailyMode ? 'daily' : 'practice';

        if (!snippetId) {
          console.log('No snippetId, aborting');
          return;
        }

        const attemptData = { 
          snippet_id: snippetId, 
          mode, 
          elapsed_ms: Math.round((totalWordsTyped / (wpm || 1)) * 60000), 
          wpm: Math.round(wpm), 
          accuracy: Math.round(finalAccuracy * 100) / 100 
        };
        
        console.log('Submitting attempt:', attemptData);
        
        const response = await fetch('/api/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(attemptData)
        });
        
        const result = await response.json();
        console.log('Attempt response:', result);
        
        // Calculate and show XP gained for logged in users
        if (isLoggedIn) {
          const earnedXp = calculateXpGained(Math.round(wpm), finalAccuracy);
          setXpGained(earnedXp);
          setShowXpMessage(true);
          
          // Hide XP message after 4 seconds
          setTimeout(() => setShowXpMessage(false), 4000);
        }
      } catch (error) {
        console.error('Error submitting attempt:', error);
      }
    };
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const isLocked = isDailyMode && attemptsRemaining <= 0;

  return (
    <div className="w-full max-w-4xl mx-auto lowercase relative">
      {isDailyMode && (
        <div className="text-center text-zinc-700 dark:text-zinc-300 mb-3">daily challenge</div>
      )}
      {isDailyMode && (
        <div className="pointer-events-none absolute -inset-x-8 -inset-y-6 rounded-[2rem] bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-blue-500/15 blur-3xl" />
      )}
      <div className="bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-colors duration-300 relative">
        {/* centered WPM and Accuracy header with mode badge */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 transition-colors duration-300">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-mono text-zinc-900 dark:text-white">
              {isComplete ? wpm.toFixed(0) : Math.max(0, Math.floor(wpm)).toString()} wpm
            </div>
            <div className="text-2xl font-mono text-zinc-900 dark:text-white">
              {accuracy !== null ? `${accuracy.toFixed(0)}% acc` : '- acc'}
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
            <span className="lowercase">{isDailyMode ? `${attemptsRemaining} attempts left` : 'practice'}</span>
          </div>
        </div>
        {/* Code Panel */}
        <div className="relative">
          <div className="flex">
            {/* Line Numbers */}
            <div className="select-none px-6 py-8 bg-zinc-100 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-800 normal-case transition-colors duration-300">
              {snippetLines.map((_, index) => (
                <div key={index} className="text-zinc-500 text-base font-mono leading-7">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 relative">
              {/* Visual overlay rendered behind the textarea so the caret remains visible */}
              <div className="absolute inset-0 p-8 font-mono no-liga text-lg leading-7 pointer-events-none z-0 whitespace-pre-wrap normal-case">
                {snippet.split('').map((char, index) => renderCharacter(char, index))}
              </div>
              
              {/* Enter hint - positioned next to cursor */}
              {enterHintPosition && (
                <div 
                  className="absolute pointer-events-none z-10 w-5 h-5 bg-blue-500/20 border border-blue-400/40 rounded flex items-center justify-center animate-fade-in"
                  style={enterHintPosition}
                >
                  <span className="text-blue-600 dark:text-blue-400 text-xs">↵</span>
                </div>
              )}
              
              
              
              
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="relative z-10 w-full h-full p-8 bg-transparent text-transparent font-mono no-liga text-lg leading-7 resize-none outline-none caret-transparent selection:bg-green-500/30 normal-case"
                style={{ 
                  caretColor: 'transparent',
                  minHeight: `${snippetLines.length * 1.9 + 6}rem`
                }}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                disabled={isComplete || isLocked}
                placeholder=""
              />
            </div>
          </div>
          
          {/* Glow Effect depends on focus */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            hasStarted && isFocused && !isComplete
              ? 'opacity-100'
              : 'opacity-0'
          }`}>
            <div className={`absolute inset-0 rounded-xl ${hasMistake ? 'bg-red-500/10' : 'bg-green-500/10'}`}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-200 dark:bg-zinc-800 transition-colors duration-300">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100 ease-out"
            style={{ width: `${(userInput.length / snippet.length) * 100}%` }}
          />
        </div>
      </div>

      {/* controls */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {isDailyMode ? (
            <GetStartedButton onClick={handleLeaderboardOpen} label="leaderboard" />
          ) : (
            <>
              <GetStartedButton onClick={handleRefresh} />
              {onLanguageChange && (
                <LanguageFilterDropdown 
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={onLanguageChange}
                />
              )}
            </>
          )}
        </div>
        {!isDailyMode && (
          <button
            onClick={() => {
              const next = !autoNext; setAutoNext(next); try { localStorage.setItem('typrr_auto_next', next ? '1' : '0'); } catch {}
            }}
            className={`px-4 py-2 rounded-xl border text-sm transition-colors ${autoNext ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-zinc-300 bg-white/10 text-zinc-400 dark:border-zinc-700'}`}
          >
            {autoNext ? 'auto-next: on' : 'auto-next: off'}
          </button>
        )}
      </div>

      <LeaderboardModal open={lbOpen} onOpenChange={setLbOpen} daily={dailyData} />

      {isLocked && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-zinc-200/40 text-zinc-700 px-4 py-2 rounded-lg border border-zinc-300 dark:bg-zinc-800/40 dark:text-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-medium">no attempts left · come back tomorrow</span>
          </div>
        </div>
      )}

      {isComplete && !isLocked && (
        <div className="mt-6 text-center space-y-3">
          {/* Main completion message */}
          <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border lowercase bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
            <span className="text-base font-medium">challenge complete</span>
          </div>
          
          {/* XP gained message for logged in users */}
          {showXpMessage && isLoggedIn && xpGained && (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border lowercase bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20">
                <span className="text-sm font-medium">+{xpGained} xp earned</span>
              </div>
            </div>
          )}
          
          {/* Login prompt for non-logged users on daily challenge */}
          {isDailyMode && !isLoggedIn && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border lowercase bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
              <span className="text-sm">
                <a href="/profile" className="underline hover:no-underline">sign in</a> to compete on the leaderboard
              </span>
            </div>
          )}
        </div>
      )}

      {/* auto-next handler for practice */}
      {!isDailyMode && isComplete && autoNext && (
        <span className="sr-only" aria-hidden="true">{setTimeout(() => handleRefresh(), 350)}</span>
      )}
    </div>
  );
};
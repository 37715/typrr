import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { GetStartedButton } from '@/components/ui/get-started-button';
import { LeaderboardModal } from '@/components/ui/leaderboard-modal';

interface CodeTypingPanelProps {
  snippet: string;
  onComplete: () => void;
  onStart: () => void;
  onReset: () => void;
  onRefresh: () => void;
}

export const CodeTypingPanel: React.FC<CodeTypingPanelProps> = ({
  snippet,
  onComplete,
  onStart,
  onReset,
  onRefresh,
}) => {
  const [userInput, setUserInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const startTimestampRef = useRef<number>(0);
  const totalCharsTyped = userInput.length;
  const totalWordsTyped = useMemo(() => totalCharsTyped / 5, [totalCharsTyped]);
  const wpm = useMemo(() => {
    if (!hasStarted || startTimestampRef.current === 0) return 0;
    const elapsedMinutes = (performance.now() - startTimestampRef.current) / 60000;
    if (elapsedMinutes <= 0) return 0;
    return totalWordsTyped / elapsedMinutes;
  }, [totalWordsTyped, hasStarted]);

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
    setIsFocused(false);
    startTimestampRef.current = 0;
    onReset();

    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippet]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Normalize Windows CRLF to LF to match snippet formatting
    const value = e.target.value.replace(/\r\n/g, '\n');
    
    if (!hasStarted && value.length > 0) {
      setHasStarted(true);
      startTimestampRef.current = performance.now();
      onStart();
    }

    // Prevent typing beyond the snippet length
    if (value.length <= snippet.length) {
      setUserInput(value);
    }
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

    // Prevent space from jumping to next line when the expected char is a newline
    if (e.key === ' ') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const cursorIndex = textarea.selectionStart ?? userInput.length;
      if (snippet[cursorIndex] === '\n') {
        e.preventDefault();
        return;
      }
    }
  };

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
      // Neutral current position indicator (subtle); pulsing only when focused
      className += isFocused && !isComplete ? ' dark:bg-gray-400/25 bg-zinc-400/25 animate-pulse' : ' dark:bg-gray-500/10 bg-zinc-300/20';
    } else {
      className += ' dark:text-gray-400 text-zinc-500';
    }

    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  };

  const handleRefresh = () => {
    onRefresh();
  };

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
        {/* centered WPM header with mode badge */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 transition-colors duration-300">
          <div className="text-2xl font-mono text-zinc-900 dark:text-white">{isComplete ? wpm.toFixed(0) : Math.max(0, Math.floor(wpm)).toString()} wpm</div>
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
      <div className="mt-8 flex justify-center">
        {isDailyMode ? (
          <GetStartedButton onClick={() => setLbOpen(true)} label="leaderboard" />
        ) : (
          <GetStartedButton onClick={handleRefresh} />
        )}
      </div>

      <LeaderboardModal open={lbOpen} onOpenChange={setLbOpen} />

      {isLocked && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-zinc-200/40 text-zinc-700 px-4 py-2 rounded-lg border border-zinc-300 dark:bg-zinc-800/40 dark:text-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-medium">no attempts left · come back tomorrow</span>
          </div>
        </div>
      )}

      {isComplete && !isLocked && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border lowercase bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
            <span className="text-base font-medium">challenge complete</span>
          </div>
        </div>
      )}
    </div>
  );
};
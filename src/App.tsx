import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CodeTypingPanel } from './components/CodeTypingPanel';
import { Top10 } from './components/Top10';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Profile } from './components/Profile';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snippetContent, setSnippetContent] = useState<string>('');
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to normalize snippet content - handles escaped newlines and Windows line endings
  const normalizeSnippetContent = (content: string): string => {
    return content
      .replace(/\\n/g, '\n')  // Convert escaped newlines to actual newlines
      .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
      .replace(/\r/g, '\n');  // Convert old Mac line endings to Unix
  };

  const handleTypingStart = () => {};

  const handleTypingComplete = () => {
    // Refresh leaderboard when someone completes a challenge - but only once
    const isDailyMode = window.location.pathname.includes('daily');
    if (isDailyMode && !refreshTimeoutRef.current) {
      // Only set timeout if one doesn't already exist
      refreshTimeoutRef.current = setTimeout(() => {
        setLeaderboardRefresh(prev => prev + 1);
        refreshTimeoutRef.current = null;
      }, 2000); // Wait 2 seconds before refreshing leaderboard once
    }
  };

  const handleReset = () => {};

  const handleRefresh = () => {
    // Trigger a reload by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // No need to manually trigger refresh - the useEffect will handle it when selectedLanguage changes
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadSnippet = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        const isPractice = window.location.pathname.includes('practice');
        
        let endpoint = isPractice ? '/api/practice/random' : '/api/daily';
        
        // Add language filter for practice mode
        if (isPractice && selectedLanguage !== 'all') {
          endpoint += `?language=${selectedLanguage}`;
        }
        
        console.log('🔍 Loading snippet with endpoint:', endpoint, 'selectedLanguage:', selectedLanguage);
        
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Received snippet:', data.snippet.language, 'ID:', data.snippet.id);
          const normalizedContent = normalizeSnippetContent(data.snippet.content);
          setSnippetContent(normalizedContent);
          setSnippetId(data.snippet.id);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setApiError(`API ${endpoint} failed: ${errorData.error}`);
          console.warn(`API ${endpoint} failed:`, errorData);
          setSnippetContent('');
          setSnippetId(null);
        }
      } catch (error) {
        console.error('Failed to load snippet:', error);
        setApiError('Failed to connect to API');
        setSnippetContent('');
        setSnippetId(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSnippet();
  }, [refreshTrigger, selectedLanguage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col lowercase bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center">
            <div className="text-xl text-zinc-600 dark:text-zinc-400">loading challenge...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lowercase bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="w-full space-y-8">
          <Routes>
            <Route path="/daily" element={
              <>
                <div className="text-center text-zinc-700 dark:text-zinc-300 mb-2 sr-only">daily challenge</div>
                {apiError && (
                  <div className="text-center text-amber-600 dark:text-amber-400 text-sm mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border">
                    {apiError}
                  </div>
                )}
                {/* Main content container - responsive width */}
                <div className="max-w-4xl mx-auto">
                  <CodeTypingPanel
                    snippet={snippetContent}
                    snippetId={snippetId}
                    onComplete={handleTypingComplete}
                    onStart={handleTypingStart}
                    onReset={handleReset}
                    onRefresh={handleRefresh}
                  />
                </div>
                
                {/* Leaderboard - shows below main content for all screen sizes */}
                <div className="mt-8 max-w-4xl mx-auto">
                  <Top10 refreshTrigger={leaderboardRefresh} />
                </div>
              </>
            } />
            <Route path="/practice" element={
              <>
                <div className="text-center text-zinc-700 dark:text-zinc-300 mb-2 sr-only">practice</div>
                {apiError && (
                  <div className="text-center text-amber-600 dark:text-amber-400 text-sm mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border">
                    {apiError}
                  </div>
                )}
                <CodeTypingPanel
                  snippet={snippetContent}
                  snippetId={snippetId}
                  onComplete={handleTypingComplete}
                  onStart={handleTypingStart}
                  onReset={handleReset}
                  onRefresh={handleRefresh}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </>
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/daily" replace />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
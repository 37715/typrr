import React, { useEffect, useState } from 'react';
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

  // Function to normalize snippet content - handles escaped newlines and Windows line endings
  const normalizeSnippetContent = (content: string): string => {
    return content
      .replace(/\\n/g, '\n')  // Convert escaped newlines to actual newlines
      .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
      .replace(/\r/g, '\n');  // Convert old Mac line endings to Unix
  };

  const handleTypingStart = () => {};

  const handleTypingComplete = () => {
    // Refresh leaderboard when someone completes a challenge
    const isDailyMode = window.location.pathname.includes('daily');
    if (isDailyMode) {
      setLeaderboardRefresh(prev => prev + 1);
    }
  };

  const handleReset = () => {};

  const handleRefresh = () => {
    // Trigger a reload by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setRefreshTrigger(prev => prev + 1); // Trigger a reload with new language filter
  };

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
        
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
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
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="relative">
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
                  <div className="hidden lg:block absolute right-4 top-9 w-96 xl:w-[28rem]">
                    <Top10 refreshTrigger={leaderboardRefresh} />
                  </div>
                  <div className="lg:hidden mt-8">
                    <Top10 refreshTrigger={leaderboardRefresh} />
                  </div>
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
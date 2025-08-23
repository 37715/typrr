import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CodeTypingPanel } from './components/CodeTypingPanel';
import { codeSnippets } from './data/snippets';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';

function App() {
  const [currentSnippetIndex, setCurrentSnippetIndex] = useState(0);

  const currentSnippet = codeSnippets[currentSnippetIndex];

  const handleTypingStart = () => {};

  const handleTypingComplete = () => {};

  const handleReset = () => {};

  const handleRefresh = () => {
    const nextIndex = (currentSnippetIndex + 1) % codeSnippets.length;
    setCurrentSnippetIndex(nextIndex);
  };

  return (
    <div className="min-h-screen flex flex-col lowercase bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-6xl space-y-8">
          <Routes>
            <Route path="/daily" element={
              <>
                <div className="text-center text-zinc-700 dark:text-zinc-300 mb-2 sr-only">daily challenge</div>
                <CodeTypingPanel
                  snippet={currentSnippet}
                  onComplete={handleTypingComplete}
                  onStart={handleTypingStart}
                  onReset={handleReset}
                  onRefresh={handleRefresh}
                />
              </>
            } />
            <Route path="/practice" element={
              <>
                <div className="text-center text-zinc-700 dark:text-zinc-300 mb-2 sr-only">practice</div>
                <CodeTypingPanel
                  snippet={currentSnippet}
                  onComplete={handleTypingComplete}
                  onStart={handleTypingStart}
                  onReset={handleReset}
                  onRefresh={handleRefresh}
                />
              </>
            } />
            <Route path="*" element={<Navigate to="/daily" replace />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
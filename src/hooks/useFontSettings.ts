import { useState, useEffect } from 'react';

type FontFamily = 'mono' | 'inter';

export const useFontSettings = () => {
  const [fontFamily, setFontFamily] = useState<FontFamily>('mono');

  useEffect(() => {
    // Load font preference from localStorage on mount
    const savedFont = localStorage.getItem('typrr_font') as FontFamily;
    if (savedFont && (savedFont === 'mono' || savedFont === 'inter')) {
      setFontFamily(savedFont);
      applyFont(savedFont);
    }
  }, []);

  const applyFont = (font: FontFamily) => {
    const root = document.documentElement;
    
    if (font === 'inter') {
      // Apply Inter Medium (500) to all text except code snippets
      root.style.setProperty('--font-family-base', 'Inter, sans-serif');
      root.style.setProperty('--font-weight-base', '500');
      
      // Add a class to body for easier CSS targeting
      document.body.classList.add('font-inter');
      document.body.classList.remove('font-mono');
    } else {
      // Apply JetBrains Mono (default)
      root.style.setProperty('--font-family-base', '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace');
      root.style.setProperty('--font-weight-base', '400');
      
      document.body.classList.add('font-mono');
      document.body.classList.remove('font-inter');
    }
  };

  const changeFontFamily = (newFont: FontFamily) => {
    setFontFamily(newFont);
    applyFont(newFont);
    localStorage.setItem('typrr_font', newFont);
  };

  return {
    fontFamily,
    changeFontFamily
  };
};
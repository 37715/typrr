import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface LanguageFilterDropdownProps {
  onLanguageChange: (language: string) => void;
  selectedLanguage: string;
}

const languages = [
  { value: 'all', label: 'all languages' },
  { value: 'javascript', label: 'javascript' },
  { value: 'typescript', label: 'typescript' },
  { value: 'python', label: 'python' },
  { value: 'java', label: 'java' },
  { value: 'go', label: 'go' },
  { value: 'rust', label: 'rust' },
  { value: 'cpp', label: 'c++' },
  { value: 'csharp', label: 'c#' },
  { value: 'ruby', label: 'ruby' },
  { value: 'php', label: 'php' },
  { value: 'swift', label: 'swift' },
  { value: 'kotlin', label: 'kotlin' },
  { value: 'scala', label: 'scala' },
  { value: 'haskell', label: 'haskell' },
  { value: 'zig', label: 'zig' },
  { value: 'assembly', label: 'assembly' },
  { value: 'lua', label: 'lua' },
];

export function LanguageFilterDropdown({ onLanguageChange, selectedLanguage }: LanguageFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = languages.find(lang => lang.value === selectedLanguage)?.label || 'all languages';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const rows = Math.ceil(languages.length / 3); // 3 columns
      const dropdownHeight = rows * 48 + 32; // Grid height + padding
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  }, [isOpen]);

  const handleLanguageSelect = (language: string) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        ref={buttonRef}
        className="group relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-800 text-white hover:bg-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 md:px-8"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
          {selectedLabel}
        </span>
        <i className="absolute right-1 top-1 bottom-1 rounded-xl z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
          <ChevronDown 
            size={16} 
            strokeWidth={2} 
            aria-hidden="true"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </i>
      </Button>

      {isOpen && (
        <div className={`absolute -right-4 z-50 ${
          dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="w-80 rounded-xl border border-zinc-300 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden dark:border-zinc-700 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-0 p-2">
              {languages.map((language) => (
                <button
                  key={language.value}
                  onClick={() => handleLanguageSelect(language.value)}
                  className={`px-3 py-2 text-sm text-center text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-200 ${
                    selectedLanguage === language.value 
                      ? 'bg-zinc-200 dark:bg-zinc-800 font-medium' 
                      : ''
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
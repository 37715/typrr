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
      const dropdownHeight = languages.length * 48 + 16; // Approximate height
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
        className="group relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 md:px-8"
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
        <div className={`absolute left-0 right-0 z-50 ${
          dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="rounded-xl border border-zinc-300 bg-zinc-900 shadow-lg overflow-hidden dark:border-zinc-700 dark:bg-zinc-900 max-h-48 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.value}
                onClick={() => handleLanguageSelect(language.value)}
                className={`w-full px-4 py-3 text-left text-white hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors duration-200 ${
                  selectedLanguage === language.value ? 'bg-zinc-800 dark:bg-zinc-800' : ''
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
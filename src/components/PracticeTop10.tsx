import React, { useState } from 'react';
import { Trophy, ChevronDown } from 'lucide-react';

type TimePeriod = 'today' | 'week' | 'alltime';

interface PracticeTop10Props {
  className?: string;
  selectedLanguage?: string;
}

export const PracticeTop10: React.FC<PracticeTop10Props> = ({ className = '', selectedLanguage = 'all' }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('alltime');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const periods = [
    { key: 'today' as const, label: 'today' },
    { key: 'week' as const, label: 'this week' },
    { key: 'alltime' as const, label: 'all time' }
  ];

  const currentPeriod = periods.find(p => p.key === timePeriod)?.label || 'all time';

  return (
    <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            top 10 practice
          </h2>
        </div>
        
        {/* Time period selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {currentPeriod}
            <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[100px]">
              {periods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => {
                    setTimePeriod(period.key);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    timePeriod === period.key 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="text-center py-12">
        <div className="mb-4">
          <Trophy size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          coming soon
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          practice leaderboards will track your best attempts
          <br />
          across different languages and time periods
        </p>
        {selectedLanguage !== 'all' && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {selectedLanguage} • {currentPeriod}
          </p>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};
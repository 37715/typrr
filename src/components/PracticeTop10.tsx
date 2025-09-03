import React, { useState } from 'react';
import { Trophy } from 'lucide-react';

type TimePeriod = 'today' | 'week' | 'alltime';

interface PracticeTop10Props {
  className?: string;
  selectedLanguage?: string;
}

export const PracticeTop10: React.FC<PracticeTop10Props> = ({ className = '', selectedLanguage = 'all' }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('alltime');

  const periods = [
    { key: 'today' as const, label: 'today' },
    { key: 'week' as const, label: 'this week' },
    { key: 'alltime' as const, label: 'all time' }
  ];

  return (
    <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg w-full ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Trophy size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            snippet leaderboard
          </h2>
        </div>
        
        {/* Horizontal tab selector */}
        <div className="flex gap-1">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setTimePeriod(period.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timePeriod === period.key 
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200 dark:bg-white dark:text-zinc-900' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {period.label}
            </button>
          ))}
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
            {selectedLanguage} • {periods.find(p => p.key === timePeriod)?.label}
          </p>
        )}
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Trophy, Play } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  wpm: number;
  accuracy: number;
  elapsed_ms: number;
  total_attempts: number;
  created_at: string;
}

interface Top10Props {
  className?: string;
  refreshTrigger?: number;
}

export const Top10: React.FC<Top10Props> = ({ className = '', refreshTrigger }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard/daily');
      
      if (!response.ok) {
        throw new Error('failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchLeaderboard();
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-yellow-500" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              top 10 today
            </h2>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            top 10 today
          </h2>
        </div>
        <div className="text-center py-6">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">failed to load</p>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            try again
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            top 10 today
          </h2>
        </div>
        <div className="text-center py-6">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            no attempts yet today. be the first!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Trophy size={20} className="text-yellow-500" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          top 10 today
        </h2>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-800">
              <th className="pb-2 w-8">#</th>
              <th className="pb-2">user</th>
              <th className="pb-2 w-12 text-center">wpm</th>
              <th className="pb-2 w-12 text-center">acc</th>
              <th className="pb-2 w-12 text-center">time</th>
              <th className="pb-2 w-20 text-right">replay</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.user_id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-2 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {index + 1 === 1 && '🥇'}
                  {index + 1 === 2 && '🥈'} 
                  {index + 1 === 3 && '🥉'}
                  {index + 1 > 3 && (index + 1)}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={entry.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.username)}`} 
                      className="h-6 w-6 rounded-full" 
                      alt="avatar" 
                    />
                    <span className="text-sm font-medium text-zinc-800 dark:text-white truncate max-w-[120px]">
                      {entry.username}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-sm font-bold text-center text-zinc-800 dark:text-white">
                  {Math.round(entry.wpm)}
                </td>
                <td className="py-2 text-sm text-center text-zinc-700 dark:text-zinc-400">
                  {Math.round(entry.accuracy)}%
                </td>
                <td className="py-2 text-sm text-center text-zinc-700 dark:text-zinc-400">
                  {(entry.elapsed_ms / 1000).toFixed(1)}s
                </td>
                <td className="py-2 text-right">
                  <button 
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded transition-colors cursor-not-allowed opacity-60"
                    disabled
                    title="replay feature coming soon"
                  >
                    <Play size={10} />
                    replay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 pt-3 border-t border-zinc-300 dark:border-zinc-700">
        <button
          onClick={fetchLeaderboard}
          className="w-full px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          refresh
        </button>
      </div>
    </div>
  );
};
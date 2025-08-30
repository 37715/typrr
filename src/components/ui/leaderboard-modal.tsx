import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

type Entry = {
  id: string;
  username: string;
  avatarUrl?: string;
  wpm: number;
  timeMs: number;
};

type TabKey = 'daily' | 'alltime';

export function LeaderboardModal({ open, onOpenChange, daily = [], alltime = [] }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daily?: Entry[];
  alltime?: Entry[];
}) {
  const [tab, setTab] = useState<TabKey>('daily');

  const data = useMemo(() => (tab === 'daily' ? daily : alltime), [tab, daily, alltime]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative z-10 w-full max-w-2xl mt-24 sm:mt-28 md:mt-32 mb-24 rounded-2xl border bg-white/90 text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-1 rounded-full bg-zinc-200 p-1 dark:bg-white/5">
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition ${tab === 'daily' ? 'bg-white text-zinc-900 dark:bg-white/90' : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'}`}
                  onClick={() => setTab('daily')}
                >
                  daily challenge
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition ${tab === 'alltime' ? 'bg-white text-zinc-900 dark:bg-white/90' : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'}`}
                  onClick={() => setTab('alltime')}
                >
                  hall of fame
                </button>
              </div>
              <button
                className="rounded-lg px-3 py-1.5 text-sm border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                close
              </button>
            </div>

            <div className="px-5 py-4">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                    <th className="w-14">rank</th>
                    <th>user</th>
                    <th className="w-20">wpm</th>
                    <th className="w-20">acc</th>
                    <th className="w-24">time</th>
                    <th className="w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 dark:text-zinc-400">no entries yet</td>
                    </tr>
                  )}
                  {data.map((e, i) => (
                    <tr key={e.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 text-sm tabular-nums">{i + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={e.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.username)}`} className="h-8 w-8 rounded-full" alt="avatar" />
                          <span className="text-sm">{e.username}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm font-semibold">{Math.round(e.wpm)}</td>
                      <td className="py-3 text-sm">{e.accuracy ? Math.round(e.accuracy) : '-'}%</td>
                      <td className="py-3 text-sm">{(e.timeMs / 1000).toFixed(2)}s</td>
                      <td className="py-3 text-right">
                        <button className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-white/10">watch replay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}



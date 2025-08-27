import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { GetStartedButton } from '@/components/ui/get-started-button';

export const Profile: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [avgWpm, setAvgWpm] = useState<number | null>(null);
  const [avgAcc, setAvgAcc] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? '');
      setUsername(user?.user_metadata?.user_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'user');
      
      if (user) {
        // Fetch user stats from database
        const { data: stats, error } = await supabase
          .from('user_stats')
          .select('avg_wpm, avg_accuracy, total_attempts')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.log('No stats found for user:', error);
          setAvgWpm(null);
          setAvgAcc(null);
          setXp(0);
        } else if (stats) {
          console.log('User stats found:', stats);
          setAvgWpm(stats.avg_wpm);
          setAvgAcc(stats.avg_accuracy);
          // Simple XP calculation based on attempts and performance
          const xpFromPerformance = stats.avg_wpm * (stats.avg_accuracy / 100) * 10;
          const xpFromAttempts = stats.total_attempts * 5;
          setXp(Math.round(xpFromPerformance + xpFromAttempts));
        } else {
          console.log('Stats query returned no data');
          setAvgWpm(null);
          setAvgAcc(null);
          setXp(0);
        }
      }
    })();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: 'error', title: 'sign out failed', description: 'please try again' });
      return;
    }
    toast({ variant: 'success', title: 'signed out' });
    window.location.href = '/daily';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-center text-zinc-700 dark:text-zinc-300 mb-6">profile</h2>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white/60 dark:bg-zinc-900/60">
        <div className="text-zinc-700 dark:text-zinc-200 mb-1">{username}</div>
        <div className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">{email}</div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <LevelCard avgWpm={avgWpm} avgAcc={avgAcc} xp={xp} />
          <Stat label="average wpm" value={avgWpm !== null ? Math.round(avgWpm).toString() : '—'} />
          <Stat label="average accuracy" value={avgAcc !== null ? `${Math.round(avgAcc)}%` : '—'} />
        </div>

        <div className="flex justify-between items-center">
          <GetStartedButton onClick={handleSignOut} label="sign out" />
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white/50 dark:bg-zinc-900/50 text-center">
    <div className="text-2xl font-mono text-zinc-900 dark:text-white mb-1">{value}</div>
    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
  </div>
);

function computeLevel(avgWpm: number | null, avgAcc: number | null) {
  if (avgWpm == null || avgAcc == null) return '—';
  const score = avgWpm * (avgAcc / 100);
  // Basic tiers; later we can base this on attempts volume, streaks etc.
  if (score >= 220) return 'legend';
  if (score >= 160) return 'master';
  if (score >= 120) return 'pro';
  if (score >= 80) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'novice';
}

const LevelCard: React.FC<{ avgWpm: number | null; avgAcc: number | null; xp: number | null }> = ({ avgWpm, avgAcc, xp }) => {
  if (avgWpm == null || avgAcc == null) {
    return <Stat label="level" value="—" />;
  }
  const score = avgWpm * (avgAcc / 100);
  const tiers = [
    { name: 'novice', cap: 40 },
    { name: 'intermediate', cap: 80 },
    { name: 'advanced', cap: 120 },
    { name: 'pro', cap: 160 },
    { name: 'master', cap: 220 },
    { name: 'legend', cap: Infinity },
  ];
  let current = tiers[0];
  let next = tiers[1];
  for (let i = 0; i < tiers.length; i++) {
    if (score < tiers[i].cap) {
      current = tiers[Math.max(0, i - 1)];
      next = tiers[i];
      break;
    }
  }
  const base = current.cap === 40 ? 0 : current.cap;
  const cap = next.cap === Infinity ? base + 40 : next.cap;
  const progress = Math.min(1, Math.max(0, (score - base) / (cap - base)));
  const xpVal = xp ?? Math.round(score * 10);
  const xpNeeded = Math.max(0, Math.round((cap - score) * 10));

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white/50 dark:bg-zinc-900/50">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-mono text-zinc-900 dark:text-white">{computeLevel(avgWpm, avgAcc)}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">xp {xpVal} / +{xpNeeded}</div>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
};



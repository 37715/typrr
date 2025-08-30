import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { GetStartedButton } from '@/components/ui/get-started-button';
import { Trophy, Zap, Target, Crown, Star, Gem, Edit2, Upload, Check, X, User } from 'lucide-react';

export const Profile: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [customUsername, setCustomUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avgWpm, setAvgWpm] = useState<number | null>(null);
  const [avgAcc, setAvgAcc] = useState<number | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? '');
      setUsername(user?.user_metadata?.user_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'user');
      
      if (user) {
        // Fetch user profile (username and avatar)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.log('Profile not found or table not accessible:', profileError);
            // Initialize with default values
            setCustomUsername('');
            setAvatarUrl('');
            setTempUsername('');
          } else if (profile) {
            setCustomUsername(profile.username || '');
            setAvatarUrl(profile.avatar_url || '');
            setTempUsername(profile.username || '');
          }
        } catch (error) {
          console.log('Error fetching profile:', error);
        }
        
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
          setTotalAttempts(0);
          setXp(0);
        } else if (stats) {
          console.log('User stats found:', stats);
          setAvgWpm(stats.avg_wpm);
          setAvgAcc(stats.avg_accuracy);
          setTotalAttempts(stats.total_attempts || 0);
          // Calculate XP: each completed challenge gives base XP + performance bonus
          const baseXpPerAttempt = 5; // Base XP per challenge
          const performanceMultiplier = stats.avg_wpm && stats.avg_accuracy 
            ? (stats.avg_wpm * (stats.avg_accuracy / 100)) / 50 // Normalize to ~1-3x multiplier
            : 1;
          const calculatedXp = Math.round((stats.total_attempts || 0) * baseXpPerAttempt * Math.max(0.5, Math.min(3, performanceMultiplier)));
          setXp(calculatedXp);
        } else {
          console.log('Stats query returned no data');
          setAvgWpm(null);
          setAvgAcc(null);
          setTotalAttempts(0);
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

  const handleUsernameUpdate = async () => {
    if (!tempUsername.trim() || tempUsername.trim().length < 3) {
      toast({ variant: 'error', title: 'username too short', description: 'must be at least 3 characters' });
      return;
    }

    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (user) {
      try {
        // Use the new function that handles username change limits
        const { data: result, error } = await supabase.rpc('update_username_with_limits', {
          user_id: user.id,
          new_username: tempUsername.trim().toLowerCase()
        });
        
        if (error) {
          console.error('Username update error:', error);
          toast({ variant: 'error', title: 'update failed', description: 'please try again' });
        } else if (result && result.success) {
          setCustomUsername(tempUsername.trim().toLowerCase());
          setIsEditingUsername(false);
          const remaining = result.changes_remaining || 0;
          toast({ 
            variant: 'success', 
            title: 'username updated', 
            description: `${remaining} changes remaining this month`
          });
        } else if (result && !result.success) {
          if (result.error === 'username_limit_exceeded') {
            toast({ variant: 'error', title: 'change limit exceeded', description: 'you can only change your username twice per month' });
          } else if (result.error === 'username_taken') {
            toast({ variant: 'error', title: 'username taken', description: 'please choose a different username' });
          } else {
            toast({ variant: 'error', title: 'update failed', description: result.message || 'please try again' });
          }
        }
      } catch (err) {
        console.error('Username update error:', err);
        toast({ variant: 'error', title: 'update failed', description: 'please try again' });
      }
    }
    setIsLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'error', title: 'invalid file', description: 'please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'error', title: 'file too large', description: 'please select an image under 5MB' });
      return;
    }

    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (user) {
      try {
        // Convert image to Base64 data URL
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          
          // Update profile with Base64 image data
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ 
              id: user.id, 
              avatar_url: base64Data
            });
          
          if (updateError) {
            console.error('Profile update error:', updateError);
            toast({ variant: 'error', title: 'profile update failed', description: 'please try again' });
          } else {
            setAvatarUrl(base64Data);
            toast({ variant: 'success', title: 'profile picture updated' });
          }
          setIsLoading(false);
        };
        
        reader.onerror = () => {
          toast({ variant: 'error', title: 'file read error', description: 'please try again' });
          setIsLoading(false);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Avatar upload error:', error);
        toast({ variant: 'error', title: 'upload failed', description: 'please try again' });
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-center text-zinc-700 dark:text-zinc-300 mb-6">profile</h2>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white/60 dark:bg-zinc-900/60">
        {/* Profile Picture and Username */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-zinc-500" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
              <Upload size={12} className="text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              {isEditingUsername ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="flex-1 px-2 py-1 text-lg font-medium bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username"
                    maxLength={20}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleUsernameUpdate}
                    disabled={isLoading}
                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsername(false);
                      setTempUsername(customUsername);
                    }}
                    disabled={isLoading}
                    className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-medium text-zinc-700 dark:text-zinc-200">
                    {customUsername || username}
                  </span>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <LevelIcon xp={xp} />
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">{email}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <LevelCard xp={xp} />
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

function getLevelInfo(xp: number) {
  // XP thresholds: 20 challenges = 100 XP, 100 = 500 XP, 500 = 2500 XP, 1000 = 5000 XP
  // Assuming 5 XP per challenge on average
  const levels = [
    { name: 'novice', icon: Zap, threshold: 0, color: 'text-gray-500' },
    { name: 'intermediate', icon: Target, threshold: 100, color: 'text-blue-500' }, // ~20 challenges
    { name: 'advanced', icon: Trophy, threshold: 500, color: 'text-purple-500' }, // ~100 challenges
    { name: 'expert', icon: Crown, threshold: 2500, color: 'text-orange-500' }, // ~500 challenges
    { name: 'master', icon: Star, threshold: 5000, color: 'text-yellow-500' }, // ~1000 challenges
    { name: 'legend', icon: Gem, threshold: 12500, color: 'text-pink-500' } // ~2500 challenges
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].threshold) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i];
    } else {
      break;
    }
  }
  
  return { currentLevel, nextLevel };
}

const LevelIcon: React.FC<{ xp: number; size?: 'sm' | 'md' }> = ({ xp, size = 'sm' }) => {
  const { currentLevel } = getLevelInfo(xp);
  const Icon = currentLevel.icon;
  const iconSize = size === 'sm' ? 16 : 20;
  
  return (
    <Icon 
      size={iconSize} 
      className={`${currentLevel.color} flex-shrink-0`}
    />
  );
};

const LevelCard: React.FC<{ xp: number }> = ({ xp }) => {
  const { currentLevel, nextLevel } = getLevelInfo(xp);
  const CurrentIcon = currentLevel.icon;
  
  // Calculate progress to next level
  const progress = nextLevel.threshold > currentLevel.threshold 
    ? Math.min(1, (xp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold))
    : 1;
  
  const xpNeeded = nextLevel.threshold > currentLevel.threshold 
    ? Math.max(0, nextLevel.threshold - xp)
    : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white/50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 mb-3">
        <CurrentIcon size={24} className={`${currentLevel.color} flex-shrink-0`} />
        <div className="text-2xl font-mono text-zinc-900 dark:text-white lowercase">{currentLevel.name}</div>
      </div>
      
      {nextLevel.threshold > currentLevel.threshold ? (
        <>
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" 
              style={{ width: `${progress * 100}%` }} 
            />
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {xp} / {nextLevel.threshold} XP ({xpNeeded} to go)
          </div>
        </>
      ) : (
        <>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400 mb-2" />
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {xp} XP earned
          </div>
        </>
      )}
    </div>
  );
};



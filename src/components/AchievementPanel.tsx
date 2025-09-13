import React, { useEffect, useState } from 'react';
import { AchievementBadge } from './ui/achievement-badge';
import { supabase } from '@/lib/supabase';
import { Trophy, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  category: string;
  requirement_value: number;
  icon: string;
  color: string;
  badge_gradient: string;
  rarity: string;
  earned_at?: string;
  earned_wpm?: number;
  earned_accuracy?: number;
}

interface AchievementProgress {
  achievement_id: string;
  name: string;
  description: string;
  requirement_value: number;
  icon: string;
  color: string;
  badge_gradient: string;
  rarity: string;
  progress_percentage: number;
  is_unlocked: boolean;
}

interface AchievementPanelProps {
  userId?: string;
  currentWpm?: number;
  showProgress?: boolean;
  maxDisplay?: number;
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  userId,
  currentWpm = 0,
  showProgress = true,
  maxDisplay = 10
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchAchievements();
    if (showProgress) {
      fetchProgress();
    }
  }, [userId, currentWpm, showProgress]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_achievements', {
        p_user_id: userId
      });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase.rpc('get_achievement_progress', {
        p_user_id: userId,
        p_current_wpm: currentWpm
      });

      if (error) throw error;
      setProgress(data || []);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort achievements by requirement_value (lowest to highest) for proper left-to-right order
  const sortedAchievements = achievements.sort((a, b) => a.requirement_value - b.requirement_value);
  const unlockedAchievements = sortedAchievements.slice(0, maxDisplay);
  const nextAchievements = progress
    .filter(p => !p.is_unlocked)
    .slice(0, 3); // Show next 3 to unlock

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">achievements unlocked</h3>
            <span className="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-full text-sm font-medium">
              {achievements.length}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {unlockedAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.achievement_id}
                achievement={achievement}
                size="md"
                showTooltip={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Towards Next Achievements */}
      {showProgress && nextAchievements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">next achievements</h3>
          </div>
          
          <div className="space-y-3">
            {nextAchievements.map((achievement) => (
              <div
                key={achievement.achievement_id}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border"
              >
                <AchievementBadge
                  achievement={achievement}
                  size="sm"
                  showTooltip={false}
                  isLocked={true}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">
                      {achievement.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {achievement.requirement_value} WPM
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        achievement.progress_percentage >= 80 
                          ? 'bg-green-500' 
                          : achievement.progress_percentage >= 50 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                      )}
                      style={{ width: `${Math.min(achievement.progress_percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </span>
                    <span className="text-xs font-medium">
                      {achievement.progress_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No achievements yet */}
      {achievements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">no achievements yet</p>
          <p className="text-sm">start typing to unlock your first badge!</p>
        </div>
      )}
    </div>
  );
};
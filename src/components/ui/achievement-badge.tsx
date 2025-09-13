import React from 'react';
import { 
  Trophy, Award, Crown, Gem, Zap, Target, User, BookOpen, 
  Sword, Flame, Bolt, Baby, Footprints 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: {
    name: string;
    description: string;
    requirement_value: number;
    icon: string;
    color: string;
    badge_gradient: string;
    rarity: string;
    earned_at?: string;
    earned_wpm?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  isLocked?: boolean;
}

const iconMap = {
  Trophy,
  Award, 
  Crown,
  Gem,
  Zap,
  Target,
  User,
  BookOpen,
  Sword,
  Flame,
  Bolt,
  Baby,
  Footprints
};

const rarityStyles = {
  common: 'ring-gray-300 shadow-gray-200',
  rare: 'ring-blue-300 shadow-blue-200',
  epic: 'ring-purple-300 shadow-purple-200', 
  legendary: 'ring-orange-300 shadow-orange-200 animate-pulse',
  mythical: 'ring-pink-300 shadow-pink-200 animate-pulse shadow-lg'
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showTooltip = true,
  isLocked = false
}) => {
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
  
  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-12 h-12 p-2', 
    lg: 'w-16 h-16 p-3'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="relative group">
      <div
        className={cn(
          'rounded-full border-2 ring-2 ring-offset-2 ring-offset-background transition-all duration-300',
          sizeClasses[size],
          isLocked ? 'grayscale opacity-50' : rarityStyles[achievement.rarity as keyof typeof rarityStyles],
          'hover:scale-110 cursor-pointer'
        )}
        style={{
          background: isLocked ? '#374151' : `linear-gradient(135deg, ${achievement.badge_gradient.replace('from-', '').replace('to-', '').replace('via-', '')})`
        }}
      >
        <IconComponent 
          className={cn(
            'w-full h-full',
            isLocked ? 'text-gray-500' : 'text-white drop-shadow-sm'
          )}
        />
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-center min-w-48">
            <div className={cn('font-bold', achievement.color, textSizeClasses[size])}>
              {achievement.name}
            </div>
            <div className="text-gray-300 text-xs mt-1">
              {achievement.description}
            </div>
            <div className="text-yellow-400 text-xs mt-1 font-medium">
              {achievement.requirement_value} WPM
            </div>
            {achievement.earned_at && (
              <div className="text-green-400 text-xs mt-1">
                ✓ Unlocked {achievement.earned_wpm ? `at ${achievement.earned_wpm} WPM` : ''}
              </div>
            )}
            {isLocked && (
              <div className="text-red-400 text-xs mt-1">
                🔒 Not yet unlocked
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};
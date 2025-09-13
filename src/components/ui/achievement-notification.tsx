import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementBadge } from './achievement-badge';
import { X, Sparkles } from 'lucide-react';

interface Achievement {
  name: string;
  description: string;
  requirement_value: number;
  icon: string;
  color: string;
  badge_gradient: string;
  rarity: string;
  earned_wpm?: number;
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievements,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (achievements.length === 0) return;

    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [achievements, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (achievements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [achievements.length]);

  if (achievements.length === 0 || !isVisible) return null;

  const currentAchievement = achievements[currentIndex];

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-purple-500',
    epic: 'from-purple-500 to-pink-500',
    legendary: 'from-orange-500 to-red-500',
    mythical: 'from-pink-500 via-purple-500 to-cyan-500'
  };

  const rarityGlow = {
    common: 'drop-shadow-lg',
    rare: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    epic: 'drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    legendary: 'drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]',
    mythical: 'drop-shadow-[0_0_30px_rgba(236,72,153,0.8)]'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="relative">
          {/* Background with rarity-based gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${rarityColors[currentAchievement.rarity as keyof typeof rarityColors]} rounded-2xl opacity-90 blur-sm`}
          />
          
          {/* Main notification card */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 min-w-80 max-w-md">
            {/* Close button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center gap-2 mb-2"
              >
                <Sparkles className={`w-5 h-5 text-yellow-500 ${rarityGlow[currentAchievement.rarity as keyof typeof rarityGlow]}`} />
                <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  achievement unlocked!
                </span>
                <Sparkles className={`w-5 h-5 text-yellow-500 ${rarityGlow[currentAchievement.rarity as keyof typeof rarityGlow]}`} />
              </motion.div>
              
              {achievements.length > 1 && (
                <div className="text-xs text-gray-500">
                  {currentIndex + 1} of {achievements.length} achievements
                </div>
              )}
            </div>

            {/* Achievement content */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className={rarityGlow[currentAchievement.rarity as keyof typeof rarityGlow]}
              >
                <AchievementBadge
                  achievement={currentAchievement}
                  size="lg"
                  showTooltip={false}
                />
              </motion.div>

              <div className="flex-1">
                <motion.h3
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-xl font-bold ${currentAchievement.color} mb-1`}
                >
                  {currentAchievement.name}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                >
                  {currentAchievement.description}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full font-medium">
                    {currentAchievement.requirement_value} WPM
                  </span>
                  {currentAchievement.earned_wpm && (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ✓ Earned at {currentAchievement.earned_wpm} WPM
                    </span>
                  )}
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${currentAchievement.rarity === 'common' ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400' : ''}
                    ${currentAchievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
                    ${currentAchievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : ''}
                    ${currentAchievement.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : ''}
                    ${currentAchievement.rarity === 'mythical' ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400' : ''}
                  `}>
                    {currentAchievement.rarity}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Progress indicators for multiple achievements */}
            {achievements.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {achievements.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-yellow-500 scale-125' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Animated sparkles */}
          <div className="absolute -top-2 -right-2 pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-2 -left-2 pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [360, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
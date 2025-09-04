import React from 'react';
import { AlertTriangle, Target, TrendingDown } from 'lucide-react';

interface ProblemCharacter {
  character: string;
  accuracy: number;
  attempts: number;
  error_rate: number;
}

interface ProblemCharactersProps {
  characters: ProblemCharacter[];
}

export default function ProblemCharacters({ characters }: ProblemCharactersProps) {
  if (!characters || characters.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">problem characters</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">characters with accuracy below 85%</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg font-medium">great accuracy!</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            no characters below 85% accuracy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">problem characters</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">focus on these for improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {characters.map((char, index) => (
          <div
            key={`${char.character}-${index}`}
            className="relative group"
          >
            {/* Character Display */}
            <div 
              className={`
                w-full aspect-square rounded-xl flex items-center justify-center text-3xl font-mono font-bold
                transition-all duration-200 cursor-pointer group-hover:scale-105
                ${getCharacterColor(char.accuracy)}
              `}
            >
              <span className="text-white drop-shadow-sm">
                {char.character === ' ' ? '⎵' : char.character}
              </span>
            </div>

            {/* Accuracy Badge */}
            <div className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 rounded-full px-2 py-1 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
              <span className={`${getAccuracyColor(char.accuracy)}`}>
                {char.accuracy.toFixed(1)}%
              </span>
            </div>

            {/* Error Rate Indicator */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                <span>{char.error_rate.toFixed(1)}% errors</span>
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                <div className="font-semibold">'{char.character}' character</div>
                <div>accuracy: {char.accuracy.toFixed(1)}%</div>
                <div>attempts: {char.attempts}</div>
                <div>error rate: {char.error_rate.toFixed(1)}%</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            improvement tip
          </span>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          practice these characters slowly and deliberately. focus on correct finger placement 
          and gradually increase speed while maintaining accuracy.
        </p>
      </div>
    </div>
  );
}

function getCharacterColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30';
  if (accuracy >= 70) return 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30';
  if (accuracy >= 60) return 'bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/30';
  return 'bg-gradient-to-br from-red-700 to-red-800 shadow-lg shadow-red-700/30';
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-orange-600 dark:text-orange-400';
  if (accuracy >= 70) return 'text-red-500 dark:text-red-400';
  if (accuracy >= 60) return 'text-red-600 dark:text-red-500';
  return 'text-red-700 dark:text-red-600';
}
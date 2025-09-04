import React from 'react';
import { AlertCircle, ArrowRight, TrendingUp, Lightbulb } from 'lucide-react';

interface Mistake {
  intended: string;
  typed: string;
  frequency: number;
  mistake_type: string;
}

interface CommonMistakesProps {
  mistakes: Mistake[];
}

export default function CommonMistakes({ mistakes }: CommonMistakesProps) {
  if (!mistakes || mistakes.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">common mistakes</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">your most frequent typing errors</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg font-medium">clean typing!</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            no recurring mistakes detected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">common mistakes</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">patterns to focus on correcting</p>
        </div>
      </div>

      <div className="space-y-4">
        {mistakes.map((mistake, index) => (
          <div
            key={`${mistake.intended}-${mistake.typed}-${index}`}
            className={`
              group relative overflow-hidden rounded-xl border transition-all duration-200 hover:scale-102 cursor-pointer
              ${getMistakeStyle(mistake.mistake_type)}
            `}
          >
            <div className="flex items-center justify-between p-4">
              {/* Mistake Visualization */}
              <div className="flex items-center gap-4">
                {/* Frequency Badge */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${getFrequencyColor(mistake.frequency)}
                `}>
                  {mistake.frequency}
                </div>
                
                {/* Mistake Pattern */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">intended</div>
                    <div className={`
                      px-3 py-2 rounded-lg font-mono text-lg font-bold
                      ${getIntendedStyle()}
                    `}>
                      {mistake.intended === ' ' ? '⎵' : mistake.intended}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  
                  <div className="text-center">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">typed</div>
                    <div className={`
                      px-3 py-2 rounded-lg font-mono text-lg font-bold
                      ${getTypedStyle()}
                    `}>
                      {mistake.typed === ' ' ? '⎵' : mistake.typed}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mistake Info */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  {getMistakeIcon(mistake.mistake_type)}
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                    {mistake.mistake_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {mistake.frequency} occurrences
                </div>
              </div>
            </div>
            
            {/* Hover Tooltip */}
            <div className="absolute inset-x-0 bottom-0 transform translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-b-xl">
              <div className="text-sm font-semibold mb-1">
                {getMistakeAdvice(mistake.mistake_type)}
              </div>
              <div className="text-xs opacity-80">
                {getMistakeDescription(mistake.mistake_type, mistake.intended, mistake.typed)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Improvement Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            improvement strategies
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <strong>slow practice:</strong> type problem combinations slowly and correctly 10 times
          </div>
          <div>
            <strong>muscle memory:</strong> focus on proper finger placement for each key
          </div>
          <div>
            <strong>awareness:</strong> pause and correct mistakes immediately when they happen
          </div>
          <div>
            <strong>repetition:</strong> practice common mistake patterns in isolation
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            mistake reduction goal
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            aim for &lt;50% frequency on each pattern
          </span>
        </div>
        <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, (10 - mistakes.length) * 10)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function getMistakeStyle(type: string): string {
  switch (type) {
    case 'adjacent_key':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30';
    case 'case_error':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
    case 'substitution':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30';
    case 'deletion':
      return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30';
    case 'insertion':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30';
    default:
      return 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  }
}

function getIntendedStyle(): string {
  return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700';
}

function getTypedStyle(): string {
  return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700';
}

function getFrequencyColor(frequency: number): string {
  if (frequency >= 10) return 'bg-red-500';
  if (frequency >= 7) return 'bg-orange-500';
  if (frequency >= 5) return 'bg-yellow-500';
  if (frequency >= 3) return 'bg-blue-500';
  return 'bg-green-500';
}

function getMistakeIcon(type: string): JSX.Element {
  const iconClass = "w-4 h-4";
  const iconColor = "text-zinc-600 dark:text-zinc-400";
  
  switch (type) {
    case 'adjacent_key':
      return <span className={`${iconClass} ${iconColor}`}>⌨️</span>;
    case 'case_error':
      return <span className={`${iconClass} ${iconColor}`}>🔤</span>;
    case 'substitution':
      return <span className={`${iconClass} ${iconColor}`}>🔄</span>;
    case 'deletion':
      return <span className={`${iconClass} ${iconColor}`}>🗑️</span>;
    case 'insertion':
      return <span className={`${iconClass} ${iconColor}`}>➕</span>;
    default:
      return <AlertCircle className={`${iconClass} ${iconColor}`} />;
  }
}

function getMistakeAdvice(type: string): string {
  switch (type) {
    case 'adjacent_key':
      return 'Focus on precise finger placement';
    case 'case_error':
      return 'Practice shift key coordination';
    case 'substitution':
      return 'Slow down and concentrate';
    case 'deletion':
      return 'Ensure complete character input';
    case 'insertion':
      return 'Avoid extra keystrokes';
    default:
      return 'Practice this pattern slowly';
  }
}

function getMistakeDescription(type: string, intended: string, typed: string): string {
  switch (type) {
    case 'adjacent_key':
      return `Your fingers are hitting keys next to the target. Practice "${intended}" slowly.`;
    case 'case_error':
      return `Case mismatch between "${intended}" and "${typed}". Work on shift timing.`;
    case 'substitution':
      return `Replacing "${intended}" with "${typed}". Focus on muscle memory.`;
    case 'deletion':
      return `Missing character "${intended}". Ensure complete keystrokes.`;
    case 'insertion':
      return `Extra character in "${typed}". Avoid accidental key presses.`;
    default:
      return `Pattern: "${intended}" → "${typed}". Practice this combination.`;
  }
}
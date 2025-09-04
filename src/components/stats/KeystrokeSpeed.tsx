import React from 'react';
import { Zap, Snail, Clock, Trophy } from 'lucide-react';

interface KeystrokeData {
  character: string;
  avg_time_ms: number;
  best_time_ms?: number;
  worst_time_ms?: number;
  attempts: number;
}

interface KeystrokeSpeedProps {
  fastest: KeystrokeData[];
  slowest: KeystrokeData[];
}

export default function KeystrokeSpeed({ fastest, slowest }: KeystrokeSpeedProps) {
  if ((!fastest || fastest.length === 0) && (!slowest || slowest.length === 0)) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">keystroke speed</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">your fastest and slowest characters</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg font-medium">keep typing!</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            more data needed for speed analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">keystroke speed</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">your fastest and slowest characters</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fastest Characters */}
        {fastest && fastest.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-green-700 dark:text-green-300">fastest keystrokes</h4>
            </div>
            
            <div className="space-y-3">
              {fastest.slice(0, 5).map((char, index) => (
                <div
                  key={`fastest-${char.character}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 group hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    
                    {/* Character */}
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xl font-mono font-bold shadow-sm">
                      {char.character === ' ' ? '⎵' : char.character}
                    </div>
                    
                    {/* Speed Info */}
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">
                        {char.avg_time_ms}ms avg
                      </div>
                      {char.best_time_ms && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          best: {char.best_time_ms}ms
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Attempts */}
                  <div className="text-right">
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {char.attempts} attempts
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-125 transition-transform"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slowest Characters */}
        {slowest && slowest.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Snail className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-orange-700 dark:text-orange-300">slowest keystrokes</h4>
            </div>
            
            <div className="space-y-3">
              {slowest.slice(0, 5).map((char, index) => (
                <div
                  key={`slowest-${char.character}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 group hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    
                    {/* Character */}
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xl font-mono font-bold shadow-sm">
                      {char.character === ' ' ? '⎵' : char.character}
                    </div>
                    
                    {/* Speed Info */}
                    <div>
                      <div className="font-semibold text-orange-700 dark:text-orange-300">
                        {char.avg_time_ms}ms avg
                      </div>
                      {char.worst_time_ms && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <Snail className="w-3 h-3" />
                          worst: {char.worst_time_ms}ms
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Attempts */}
                  <div className="text-right">
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      {char.attempts} attempts
                    </div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-125 transition-transform"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Speed Insights */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            speed insights
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <strong>fastest combo:</strong> practice your quickest characters together to build rhythm
          </div>
          <div>
            <strong>improvement focus:</strong> work on slow characters with deliberate practice
          </div>
        </div>
      </div>
    </div>
  );
}
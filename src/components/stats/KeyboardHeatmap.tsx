import React from 'react';
import { Thermometer, Target, Zap } from 'lucide-react';

interface KeyData {
  character: string;
  accuracy: number;
  avg_time_ms: number;
  attempts: number;
}

interface KeyboardHeatmapProps {
  characterStats: KeyData[];
  mode: 'accuracy' | 'speed';
  onModeChange?: (mode: 'accuracy' | 'speed') => void;
}

// 75% QWERTY keyboard layout with coding special characters
const KEYBOARD_LAYOUT = [
  // Function row
  ['esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'del'],
  // Number row with symbols
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
  // Top row
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  // Home row  
  ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
  // Bottom row
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift']
];

// Common coding special characters (shifted versions)
const CODING_SYMBOLS = [
  '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+',
  '{', '}', '|', ':', '"', '<', '>', '?'
];

export default function KeyboardHeatmap({ characterStats, mode, onModeChange }: KeyboardHeatmapProps) {
  // Generate realistic placeholder data for demo purposes
  const generatePlaceholderData = (): Map<string, KeyData> => {
    const placeholderMap = new Map();
    
    // Common letters with varying accuracy/speed
    const commonChars = {
      'a': { accuracy: 95, avg_time_ms: 120, attempts: 50 },
      's': { accuracy: 92, avg_time_ms: 110, attempts: 45 },
      'd': { accuracy: 96, avg_time_ms: 105, attempts: 55 },
      'f': { accuracy: 98, avg_time_ms: 100, attempts: 60 },
      'j': { accuracy: 97, avg_time_ms: 102, attempts: 58 },
      'k': { accuracy: 94, avg_time_ms: 108, attempts: 52 },
      'l': { accuracy: 93, avg_time_ms: 115, attempts: 48 },
      'q': { accuracy: 78, avg_time_ms: 180, attempts: 15 },
      'z': { accuracy: 82, avg_time_ms: 170, attempts: 18 },
      'x': { accuracy: 89, avg_time_ms: 140, attempts: 25 },
      'c': { accuracy: 94, avg_time_ms: 125, attempts: 40 },
      'v': { accuracy: 91, avg_time_ms: 135, attempts: 35 },
      'e': { accuracy: 97, avg_time_ms: 95, attempts: 80 },
      'r': { accuracy: 95, avg_time_ms: 105, attempts: 65 },
      't': { accuracy: 96, avg_time_ms: 98, attempts: 70 },
      'i': { accuracy: 94, avg_time_ms: 110, attempts: 60 },
      'o': { accuracy: 93, avg_time_ms: 115, attempts: 55 },
      'p': { accuracy: 88, avg_time_ms: 130, attempts: 30 },
      // Coding symbols - typically harder
      ';': { accuracy: 85, avg_time_ms: 150, attempts: 40 },
      ':': { accuracy: 83, avg_time_ms: 155, attempts: 35 },
      '{': { accuracy: 80, avg_time_ms: 165, attempts: 25 },
      '}': { accuracy: 79, avg_time_ms: 170, attempts: 24 },
      '[': { accuracy: 82, avg_time_ms: 160, attempts: 28 },
      ']': { accuracy: 81, avg_time_ms: 162, attempts: 27 },
      '(': { accuracy: 87, avg_time_ms: 140, attempts: 45 },
      ')': { accuracy: 86, avg_time_ms: 142, attempts: 44 },
      '=': { accuracy: 90, avg_time_ms: 135, attempts: 50 },
      '+': { accuracy: 84, avg_time_ms: 155, attempts: 30 },
      '-': { accuracy: 92, avg_time_ms: 125, attempts: 55 },
      '_': { accuracy: 88, avg_time_ms: 145, attempts: 35 },
      '/': { accuracy: 86, avg_time_ms: 150, attempts: 40 },
      '\\': { accuracy: 75, avg_time_ms: 190, attempts: 20 },
      ' ': { accuracy: 99, avg_time_ms: 80, attempts: 200 },
    };

    Object.entries(commonChars).forEach(([char, stats]) => {
      placeholderMap.set(char, {
        character: char,
        accuracy: stats.accuracy,
        avg_time_ms: stats.avg_time_ms,
        attempts: stats.attempts
      });
    });

    return placeholderMap;
  };

  // Use placeholder data if no real data provided
  const statsMap = characterStats.length > 10 
    ? new Map(characterStats.map(stat => [stat.character.toLowerCase(), stat]))
    : generatePlaceholderData();

  // Calculate min/max values for color scaling from placeholder data
  const allStats = Array.from(statsMap.values());
  const values = allStats.map(stat => 
    mode === 'accuracy' ? stat.accuracy : (1000 / Math.max(stat.avg_time_ms, 1))
  );
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 100;

  const getKeyData = (char: string) => {
    // Handle special key mappings
    const key = char.toLowerCase();
    return statsMap.get(key) || statsMap.get(getShiftedChar(key));
  };

  const getShiftedChar = (char: string): string => {
    const shiftMap: { [key: string]: string } = {
      '`': '~', '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
      '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+',
      '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?'
    };
    return shiftMap[char] || char;
  };

  const getKeyWidth = (char: string): string => {
    switch (char) {
      case 'esc': case 'del': return 'w-12';
      case 'f1': case 'f2': case 'f3': case 'f4': case 'f5': case 'f6':
      case 'f7': case 'f8': case 'f9': case 'f10': case 'f11': case 'f12': return 'w-10';
      case 'backspace': return 'w-20';
      case 'tab': return 'w-16';
      case '\\': return 'w-16';
      case 'caps': return 'w-20';
      case 'enter': return 'w-20';
      case 'shift': return 'w-24';
      default: return 'w-10';
    }
  };

  const getDisplayText = (char: string): string => {
    const displayMap: { [key: string]: string } = {
      'esc': 'esc', 'del': 'del', 'backspace': '⌫', 'tab': '⇥',
      'caps': '⇪', 'enter': '⏎', 'shift': '⇧', '\\': '\\',
      ' ': '⎵'
    };
    return displayMap[char] || char;
  };

  const getHeatColor = (keyData: KeyData | undefined): string => {
    if (!keyData || keyData.attempts < 3) {
      return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
    }

    let intensity: number;
    if (mode === 'accuracy') {
      intensity = (keyData.accuracy - minValue) / (maxValue - minValue);
    } else {
      const speed = 1000 / Math.max(keyData.avg_time_ms, 1);
      intensity = (speed - minValue) / (maxValue - minValue);
    }

    // Clamp intensity between 0 and 1
    intensity = Math.max(0, Math.min(1, intensity));

    if (mode === 'accuracy') {
      // Red to Green gradient for accuracy
      if (intensity >= 0.8) return 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30';
      if (intensity >= 0.6) return 'bg-green-400 border-green-500 text-white shadow-md shadow-green-400/20';
      if (intensity >= 0.4) return 'bg-yellow-400 border-yellow-500 text-zinc-900 shadow-md shadow-yellow-400/20';
      if (intensity >= 0.2) return 'bg-orange-400 border-orange-500 text-white shadow-md shadow-orange-400/20';
      return 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30';
    } else {
      // Blue gradient for speed
      if (intensity >= 0.8) return 'bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-600/30';
      if (intensity >= 0.6) return 'bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/20';
      if (intensity >= 0.4) return 'bg-blue-400 border-blue-500 text-white shadow-md shadow-blue-400/20';
      if (intensity >= 0.2) return 'bg-blue-300 border-blue-400 text-black shadow-md shadow-blue-300/20';
      return 'bg-blue-200 border-blue-300 text-black shadow-md shadow-blue-200/20';
    }
  };

  const getKeyValue = (keyData: KeyData | undefined): string => {
    if (!keyData || keyData.attempts < 3) return '';
    
    if (mode === 'accuracy') {
      return `${keyData.accuracy.toFixed(0)}%`;
    } else {
      return `${keyData.avg_time_ms}ms`;
    }
  };

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          {mode === 'accuracy' ? (
            <Target className="w-5 h-5 text-white" />
          ) : (
            <Zap className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              keyboard {mode} heatmap
            </h3>
            {characterStats.length <= 10 && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                preview mode
              </div>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {characterStats.length <= 10 
              ? 'preview showing sample data • real analytics coming soon'
              : 'visual representation of your typing ' + mode + ' across the keyboard'
            }
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => onModeChange?.('accuracy')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'accuracy'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            accuracy
          </button>
          <button
            onClick={() => onModeChange?.('speed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'speed'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            speed
          </button>
        </div>
      </div>

      {/* Keyboard Layout */}
      <div className={`space-y-1 mb-6 bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 relative ${
        characterStats.length <= 10 ? 'opacity-90' : ''
      }`}>
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">            
            {row.map((char, charIndex) => {
              const keyData = getKeyData(char);
              const colorClass = getHeatColor(keyData);
              const value = getKeyValue(keyData);
              const widthClass = getKeyWidth(char);
              const displayText = getDisplayText(char);
              const isSpecialKey = ['esc', 'del', 'backspace', 'tab', 'caps', 'enter', 'shift'].includes(char);
              
              return (
                <div
                  key={`${char}-${charIndex}`}
                  className={`
                    relative group ${widthClass} h-10 rounded-md border-2 flex items-center justify-center
                    font-mono text-xs font-bold cursor-pointer transition-all duration-200
                    hover:scale-105 hover:z-10 ${colorClass}
                    ${isSpecialKey ? 'opacity-70' : ''}
                  `}
                >
                  {/* Character */}
                  <span className={`${isSpecialKey ? 'text-xs' : 'text-sm'} ${isSpecialKey ? 'opacity-60' : ''}`}>
                    {displayText}
                  </span>
                  
                  {/* Shifted character overlay for symbol keys */}
                  {!isSpecialKey && getShiftedChar(char) !== char && (
                    <span className="absolute top-0.5 right-1 text-xs opacity-50">
                      {getShiftedChar(char)}
                    </span>
                  )}
                  
                  {/* Value overlay */}
                  {value && !isSpecialKey && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs rounded-md">
                      {value}
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  {keyData && !isSpecialKey && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                        <div className="font-semibold">'{char}' key</div>
                        {getShiftedChar(char) !== char && (
                          <div>shifted: '{getShiftedChar(char)}'</div>
                        )}
                        <div>accuracy: {keyData.accuracy.toFixed(1)}%</div>
                        <div>speed: {keyData.avg_time_ms}ms</div>
                        <div>attempts: {keyData.attempts}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Spacebar row */}
        <div className="flex justify-center gap-1 mt-1">
          <div className="w-24 h-10"></div> {/* Left space */}
          <div
            className={`
              relative group w-64 h-10 rounded-md border-2 flex items-center justify-center
              font-mono text-xs font-bold cursor-pointer transition-all duration-200
              hover:scale-105 hover:z-10 ${getHeatColor(getKeyData(' '))}
            `}
          >
            <span className="text-xs">space</span>
            
            {getKeyValue(getKeyData(' ')) && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs rounded-md">
                {getKeyValue(getKeyData(' '))}
              </div>
            )}
            
            {/* Spacebar tooltip */}
            {getKeyData(' ') && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  <div className="font-semibold">spacebar</div>
                  <div>accuracy: {getKeyData(' ')?.accuracy.toFixed(1)}%</div>
                  <div>speed: {getKeyData(' ')?.avg_time_ms}ms</div>
                  <div>attempts: {getKeyData(' ')?.attempts}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
                </div>
              </div>
            )}
          </div>
          <div className="w-24 h-10"></div> {/* Right space */}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-600 dark:text-zinc-400">heat intensity</span>
        </div>
        
        <div className="flex items-center gap-1">
          {mode === 'accuracy' ? (
            <>
              <div className="w-4 h-4 bg-red-500 rounded border"></div>
              <span className="text-zinc-500 mx-1">low</span>
              <div className="w-4 h-4 bg-yellow-400 rounded border"></div>
              <span className="text-zinc-500 mx-1">medium</span>
              <div className="w-4 h-4 bg-green-500 rounded border"></div>
              <span className="text-zinc-500">high accuracy</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 bg-blue-200 rounded border"></div>
              <span className="text-zinc-500 mx-1">slow</span>
              <div className="w-4 h-4 bg-blue-400 rounded border"></div>
              <span className="text-zinc-500 mx-1">medium</span>
              <div className="w-4 h-4 bg-blue-600 rounded border"></div>
              <span className="text-zinc-500">fast speed</span>
            </>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            keyboard insights
          </span>
        </div>
        <div className="text-sm text-indigo-700 dark:text-indigo-300">
          {mode === 'accuracy' ? (
            'red/orange keys need more practice • green keys are your strengths • hover over keys to see detailed stats'
          ) : (
            'darker blue keys are your fastest • lighter keys need speed work • focus on common coding patterns like ->, =>, {}, []'
          )}
        </div>
      </div>
    </div>
  );
}
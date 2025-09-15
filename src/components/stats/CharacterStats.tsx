import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProblemCharacters from './ProblemCharacters';
import KeystrokeSpeed from './KeystrokeSpeed';
import FingerUsageHeatmap from './FingerUsageHeatmap';
import CommonMistakes from './CommonMistakes';
import KeyboardHeatmap from './KeyboardHeatmap';

interface CharacterStatsData {
  problem_characters: Array<{
    character: string;
    accuracy: number;
    attempts: number;
    error_rate: number;
  }>;
  keystroke_speed: {
    fastest: Array<{
      character: string;
      avg_time_ms: number;
      best_time_ms?: number;
      attempts: number;
    }>;
    slowest: Array<{
      character: string;
      avg_time_ms: number;
      worst_time_ms?: number;
      attempts: number;
    }>;
  };
  finger_usage: Array<{
    finger_id: number;
    finger_name: string;
    keystrokes: number;
    avg_speed_ms: number;
    accuracy: number;
    workload_percent: number;
  }>;
  common_mistakes: Array<{
    intended: string;
    typed: string;
    frequency: number;
    mistake_type: string;
  }>;
  summary: {
    total_characters_analyzed: number;
    problem_character_count: number;
    average_problem_accuracy: number | null;
    most_common_mistake: any;
  };
}

interface CharacterStatsProps {
  refreshTrigger?: number;
}

export default function CharacterStats({ refreshTrigger }: CharacterStatsProps) {
  const [statsData, setStatsData] = useState<CharacterStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'accuracy' | 'speed'>('accuracy');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchCharacterStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const response = await fetch('/api/character-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('authentication failed');
        }
        throw new Error(`api error: ${response.status}`);
      }

      const data = await response.json();
      setStatsData(data);
    } catch (err) {
      console.error('Character stats fetch error:', err);
      setError(err instanceof Error ? err.message : 'failed to load character stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacterStats();
  }, [refreshTrigger]);

  // Show login prompt for non-authenticated users
  if (!loading && !isLoggedIn) {
    return (
      <div className="space-y-8 mt-8">
        {/* Collapsible Header */}
        <div 
          className="cursor-pointer bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 transition-all duration-200 hover:bg-white/70 dark:hover:bg-zinc-900/70"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="p-6">
            {/* Coming Soon Notice */}
            <div className="mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✨</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    coming soon
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    advanced analytics in development
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    character analytics
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                    click to view detailed typing insights
                  </p>
                </div>
                <div className="w-12 flex justify-center">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="relative px-6 pb-6 border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <div className="filter blur-sm pointer-events-none">
                <div className="text-center mb-6">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    detailed insights into your typing patterns, weaknesses, and areas for improvement
                  </p>
                  
                  {/* Preview Heatmap */}
                  <div className="mb-6">
                    <KeyboardHeatmap 
                      characterStats={[]} // Empty array to show placeholder
                      mode={heatmapMode}
                      onModeChange={setHeatmapMode}
                    />
                  </div>
                  
                  {/* Mock Stats Grid */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 h-32">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">problem characters</div>
                      <div className="space-y-2">
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded w-4/5"></div>
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded w-3/5"></div>
                      </div>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 h-32">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">keystroke speed</div>
                      <div className="space-y-2">
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded w-3/4"></div>
                        <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Login Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-b-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer">
                    <span className="font-medium">sign in to unlock analytics</span>
                  </div>
                  <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    track your progress • identify weaknesses • improve faster
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-12 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            analyzing your typing patterns...
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
            this may take a moment while we process your keystroke data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-8 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">stats unavailable</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
          </div>
        </div>
        
        <button
          onClick={fetchCharacterStats}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          try again
        </button>
      </div>
    );
  }

  if (!statsData) {
    return null;
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Collapsible Header */}
      <div 
        className="cursor-pointer bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 transition-all duration-200 hover:bg-white/70 dark:hover:bg-zinc-900/70"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-6">
          {/* Coming Soon Notice */}
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✨</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  coming soon
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  advanced analytics in development
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  character analytics
                </h2>
                <div className="flex items-center justify-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>click to {isExpanded ? 'hide' : 'view'} detailed insights</span>
                  {statsData.summary.total_characters_analyzed > 0 && (
                    <>
                      <span>•</span>
                      <span>{statsData.summary.total_characters_analyzed.toLocaleString()} characters analyzed</span>
                      {statsData.summary.problem_character_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            {statsData.summary.problem_character_count} problem characters
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 flex justify-center">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-zinc-200 dark:border-zinc-700 pt-6">
            <div className="text-center mb-6">
              <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                detailed insights into your typing patterns, weaknesses, and areas for improvement
              </p>
            </div>

            {/* Featured Keyboard Heatmap */}
            <div className="mb-8">
              <KeyboardHeatmap 
                characterStats={[
                  ...statsData.problem_characters.map(char => ({
                    character: char.character,
                    accuracy: char.accuracy,
                    avg_time_ms: 200, // placeholder
                    attempts: char.attempts
                  })),
                  ...statsData.keystroke_speed.fastest.map(char => ({
                    character: char.character,
                    accuracy: 95, // placeholder
                    avg_time_ms: char.avg_time_ms,
                    attempts: char.attempts
                  })),
                  ...statsData.keystroke_speed.slowest.map(char => ({
                    character: char.character,
                    accuracy: 90, // placeholder  
                    avg_time_ms: char.avg_time_ms,
                    attempts: char.attempts
                  }))
                ]}
                mode={heatmapMode}
                onModeChange={setHeatmapMode}
              />
            </div>

            {/* Stats Components Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Problem Characters */}
              <ProblemCharacters characters={statsData.problem_characters} />
              
              {/* Keystroke Speed */}
              <KeystrokeSpeed 
                fastest={statsData.keystroke_speed.fastest} 
                slowest={statsData.keystroke_speed.slowest} 
              />
              
              {/* Finger Usage Heatmap */}
              <FingerUsageHeatmap fingerStats={statsData.finger_usage} />
              
              {/* Common Mistakes */}
              <CommonMistakes mistakes={statsData.common_mistakes} />
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                📊 character-level tracking will be implemented in future updates. 
                these components show the framework for detailed typing analysis.
              </p>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                your typing data remains private and is used only to improve your experience
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
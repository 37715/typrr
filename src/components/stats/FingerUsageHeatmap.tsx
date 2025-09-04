import React from 'react';
import { Hand, Activity, Gauge, BarChart3 } from 'lucide-react';

interface FingerData {
  finger_id: number;
  finger_name: string;
  keystrokes: number;
  avg_speed_ms: number;
  accuracy: number;
  workload_percent: number;
}

interface FingerUsageHeatmapProps {
  fingerStats: FingerData[];
}

export default function FingerUsageHeatmap({ fingerStats }: FingerUsageHeatmapProps) {
  if (!fingerStats || fingerStats.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <Hand className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">finger usage</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">typing load distribution across fingers</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hand className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg font-medium">start typing!</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            finger usage data will appear here
          </p>
        </div>
      </div>
    );
  }

  // Calculate max values for scaling
  const maxKeystrokes = Math.max(...fingerStats.map(f => f.keystrokes));
  const maxWorkload = Math.max(...fingerStats.map(f => f.workload_percent));

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <Hand className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">finger usage heatmap</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">workload distribution and performance by finger</p>
        </div>
      </div>

      {/* Hand Visualization */}
      <div className="mb-8">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          workload heatmap
        </h4>
        
        <div className="flex justify-center">
          <div className="grid grid-cols-5 gap-2 p-6 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700">
            {/* Left hand (fingers 1-5) */}
            {fingerStats.filter(f => f.finger_id <= 5).reverse().map((finger) => (
              <FingerCircle
                key={finger.finger_id}
                finger={finger}
                maxWorkload={maxWorkload}
                isThumb={finger.finger_id === 5}
              />
            ))}
            
            {/* Right hand (fingers 6-10) */}
            {fingerStats.filter(f => f.finger_id > 5).map((finger) => (
              <FingerCircle
                key={finger.finger_id}
                finger={finger}
                maxWorkload={maxWorkload}
                isThumb={finger.finger_id === 6}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance by Finger */}
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            performance metrics
          </h4>
          
          <div className="space-y-3">
            {fingerStats
              .sort((a, b) => b.workload_percent - a.workload_percent)
              .slice(0, 5)
              .map((finger) => (
                <div
                  key={finger.finger_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getFingerColor(finger.workload_percent, maxWorkload) }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                      {finger.finger_name}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {finger.workload_percent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {finger.keystrokes} keys
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Speed and Accuracy */}
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            speed & accuracy
          </h4>
          
          <div className="space-y-3">
            {fingerStats
              .sort((a, b) => a.avg_speed_ms - b.avg_speed_ms) // Fastest first (lowest ms)
              .slice(0, 5)
              .map((finger) => (
                <div
                  key={`speed-${finger.finger_id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getAccuracyColor(finger.accuracy) }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                      {finger.finger_name}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {finger.avg_speed_ms}ms
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {finger.accuracy.toFixed(1)}% acc
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Balance Insights */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <Hand className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            balance insights
          </span>
        </div>
        <div className="text-sm text-purple-700 dark:text-purple-300">
          {getBalanceInsight(fingerStats)}
        </div>
      </div>
    </div>
  );
}

interface FingerCircleProps {
  finger: FingerData;
  maxWorkload: number;
  isThumb: boolean;
}

function FingerCircle({ finger, maxWorkload, isThumb }: FingerCircleProps) {
  const intensity = finger.workload_percent / maxWorkload;
  const size = isThumb ? 'w-8 h-8' : 'w-10 h-10';
  
  return (
    <div className="relative group flex flex-col items-center">
      <div 
        className={`${size} rounded-full transition-all duration-200 cursor-pointer hover:scale-110 shadow-lg`}
        style={{
          backgroundColor: getFingerColor(finger.workload_percent, maxWorkload),
          boxShadow: `0 0 ${intensity * 20}px ${getFingerColor(finger.workload_percent, maxWorkload)}40`
        }}
      />
      
      {/* Finger Label */}
      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 capitalize">
        {finger.finger_name.split(' ')[1]}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap">
          <div className="font-semibold capitalize">{finger.finger_name}</div>
          <div>workload: {finger.workload_percent.toFixed(1)}%</div>
          <div>keystrokes: {finger.keystrokes}</div>
          <div>speed: {finger.avg_speed_ms}ms</div>
          <div>accuracy: {finger.accuracy.toFixed(1)}%</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
        </div>
      </div>
    </div>
  );
}

function getFingerColor(workload: number, maxWorkload: number): string {
  const intensity = workload / maxWorkload;
  
  if (intensity >= 0.8) return '#dc2626'; // red-600
  if (intensity >= 0.6) return '#ea580c'; // orange-600
  if (intensity >= 0.4) return '#ca8a04'; // yellow-600
  if (intensity >= 0.2) return '#65a30d'; // lime-600
  return '#16a34a'; // green-600
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 95) return '#16a34a'; // green-600
  if (accuracy >= 90) return '#65a30d'; // lime-600
  if (accuracy >= 85) return '#ca8a04'; // yellow-600
  if (accuracy >= 80) return '#ea580c'; // orange-600
  return '#dc2626'; // red-600
}

function getBalanceInsight(fingerStats: FingerData[]): string {
  if (!fingerStats.length) return '';
  
  const workloads = fingerStats.map(f => f.workload_percent);
  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);
  const imbalance = maxWorkload - minWorkload;
  
  if (imbalance < 10) {
    return 'excellent finger balance! your typing load is well-distributed across all fingers.';
  } else if (imbalance < 20) {
    return 'good finger balance with some room for improvement. try to use underutilized fingers more.';
  } else {
    const overworked = fingerStats.find(f => f.workload_percent === maxWorkload);
    const underused = fingerStats.find(f => f.workload_percent === minWorkload);
    return `unbalanced load detected. your ${overworked?.finger_name} is overworked while your ${underused?.finger_name} is underused.`;
  }
}
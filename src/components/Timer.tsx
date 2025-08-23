import React from 'react';

interface TimerProps {
  isActive: boolean;
  time: number;
}

export const Timer: React.FC<TimerProps> = ({ isActive, time }) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isActive ? 'bg-green-400' : 'bg-gray-500'
          }`} />
          <span className="text-white font-mono text-lg">
            {time.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};
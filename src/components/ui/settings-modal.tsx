import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fontFamily: 'mono' | 'inter';
  onFontChange: (font: 'mono' | 'inter') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  fontFamily,
  onFontChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 p-8">
        <DialogHeader>
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white lowercase">
              settings
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Font Toggle Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Type className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-base font-medium text-zinc-900 dark:text-white lowercase">
                font family
              </h3>
            </div>
            
            {/* Interactive Font Toggle */}
            <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1.5 flex gap-1">
              {/* Background slider */}
              <div 
                className={cn(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] bg-white dark:bg-zinc-700 rounded-lg shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  fontFamily === 'mono' ? 'left-1.5' : 'left-[calc(50%+2px)]'
                )}
              />
              
              {/* Font Options */}
              <button
                onClick={() => onFontChange('mono')}
                className={cn(
                  "relative z-10 flex-1 py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  fontFamily === 'mono' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center transition-all duration-300">
                  <div className={cn(
                    "text-sm font-medium lowercase mb-1 transition-all duration-300",
                    fontFamily === 'mono' ? 'font-bold transform scale-105' : 'font-normal'
                  )}>
                    jetbrains mono
                  </div>
                  <div className={cn(
                    "text-xs transition-all duration-300",
                    fontFamily === 'mono' ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )}>
                    Ag1
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onFontChange('inter')}
                className={cn(
                  "relative z-10 flex-1 py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  fontFamily === 'inter' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center transition-all duration-300">
                  <div className={cn(
                    "text-sm font-medium lowercase mb-1 transition-all duration-300",
                    fontFamily === 'inter' ? 'font-bold transform scale-105' : 'font-normal'
                  )} style={{ fontFamily: 'Inter, sans-serif' }}>
                    inter medium
                  </div>
                  <div className={cn(
                    "text-xs transition-all duration-300",
                    fontFamily === 'inter' ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Ag1
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
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
      <DialogContent className="max-w-md mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white lowercase">
              settings
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Toggle Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white lowercase">
                font family
              </h3>
            </div>
            
            {/* Interactive Font Toggle */}
            <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 flex">
              {/* Background slider */}
              <div 
                className={cn(
                  "absolute top-1 left-1 right-1 h-12 bg-white dark:bg-zinc-700 rounded-xl shadow-sm transition-transform duration-300 ease-out",
                  fontFamily === 'mono' ? 'transform translate-x-0' : 'transform translate-x-[calc(50%-2px)]'
                )}
              />
              
              {/* Font Options */}
              <button
                onClick={() => onFontChange('mono')}
                className={cn(
                  "relative z-10 flex-1 h-12 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2",
                  fontFamily === 'mono' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium lowercase",
                    fontFamily === 'mono' ? 'font-bold' : 'font-normal'
                  )}>
                    jetbrains mono
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                    Ag1
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onFontChange('inter')}
                className={cn(
                  "relative z-10 flex-1 h-12 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2",
                  fontFamily === 'inter' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium lowercase",
                    fontFamily === 'inter' ? 'font-bold' : 'font-normal'
                  )} style={{ fontFamily: 'Inter, sans-serif' }}>
                    inter medium
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Ag1
                  </div>
                </div>
              </button>
            </div>
            
            {/* Preview Text */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 lowercase mb-1">
                preview:
              </div>
              <div 
                className={cn(
                  "text-zinc-900 dark:text-white lowercase",
                  fontFamily === 'mono' ? 'font-mono' : ''
                )}
                style={{ 
                  fontFamily: fontFamily === 'inter' ? 'Inter, sans-serif' : undefined,
                  fontWeight: fontFamily === 'inter' ? 500 : undefined
                }}
              >
                the quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
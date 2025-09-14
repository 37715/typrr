import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Type, Heart, MessageCircle, Info, Coffee, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stripePromise, createCheckoutSession } from '../../lib/stripe';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fontFamily: 'mono' | 'inter';
  onFontChange: (font: 'mono' | 'inter') => void;
}

type TabType = 'general' | 'donations' | 'discord' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  fontFamily,
  onFontChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const tabs = [
    { id: 'general' as TabType, label: 'general', icon: Type },
    { id: 'donations' as TabType, label: 'donations', icon: Heart },
    { id: 'discord' as TabType, label: 'discord', icon: MessageCircle },
    { id: 'about' as TabType, label: 'about', icon: Info },
  ];

  const handleDonation = async (amount: number, type: 'one-time' | 'recurring' = 'one-time') => {
    try {
      const session = await createCheckoutSession(amount, type);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Type className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white lowercase">
                  font family
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed lowercase">
                choose your preferred font for the typing interface. monospace fonts are recommended for coding practice.
              </p>
            </div>
            
            {/* Interactive Font Toggle */}
            <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-2 flex gap-2">
              {/* Background slider */}
              <div 
                className={cn(
                  "absolute top-2 bottom-2 w-[calc(50%-6px)] bg-white dark:bg-zinc-700 rounded-xl shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  fontFamily === 'mono' ? 'left-2' : 'left-[calc(50%+2px)]'
                )}
              />
              
              {/* Font Options */}
              <button
                onClick={() => onFontChange('mono')}
                className={cn(
                  "relative z-10 flex-1 py-6 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  fontFamily === 'mono' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center transition-all duration-300">
                  <div className={cn(
                    "text-lg font-medium lowercase mb-2 transition-all duration-300",
                    fontFamily === 'mono' ? 'font-bold transform scale-105' : 'font-normal'
                  )}>
                    jetbrains mono
                  </div>
                  <div className={cn(
                    "text-sm transition-all duration-300 font-mono",
                    fontFamily === 'mono' ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )}>
                    Ag1 0O il1
                  </div>
                  <div className={cn(
                    "text-xs mt-2 transition-all duration-300",
                    fontFamily === 'mono' ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )}>
                    recommended for coding
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onFontChange('inter')}
                className={cn(
                  "relative z-10 flex-1 py-6 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  fontFamily === 'inter' 
                    ? "text-zinc-900 dark:text-white" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <div className="text-center transition-all duration-300">
                  <div className={cn(
                    "text-lg font-medium lowercase mb-2 transition-all duration-300",
                    fontFamily === 'inter' ? 'font-bold transform scale-105' : 'font-normal'
                  )} style={{ fontFamily: 'Inter, sans-serif' }}>
                    inter medium
                  </div>
                  <div className={cn(
                    "text-sm transition-all duration-300",
                    fontFamily === 'inter' ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Ag1 0O il1
                  </div>
                  <div className={cn(
                    "text-xs mt-2 transition-all duration-300",
                    fontFamily === 'inter' ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
                  )}>
                    clean & modern
                  </div>
                </div>
              </button>
            </div>
            
            <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-base font-medium text-zinc-900 dark:text-white lowercase mb-3">font preview</h4>
              <div className="space-y-3">
                <div className={cn("text-sm p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white", 
                  fontFamily === 'mono' ? 'font-mono' : '')} 
                  style={fontFamily === 'inter' ? { fontFamily: 'Inter, sans-serif' } : {}}>
                  function calculateWPM(chars, timeMs) {'{'}
                  <br />
                  &nbsp;&nbsp;return (chars / 5) / (timeMs / 60000);
                  <br />
                  {'}'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'donations':
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Heart className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white lowercase">
                  support typrr
                </h3>
              </div>
              
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed lowercase">
                help keep typrr fast, clean, and ad-free forever. every contribution helps maintain the servers and improve the experience for everyone.
              </p>
            </div>

            {/* Quick Donation Buttons */}
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-zinc-900 dark:text-white lowercase">quick donations</h4>
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => handleDonation(5)}
                  className="group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">$5</span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 lowercase font-medium">buy me a coffee</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 lowercase mt-1">perfect for a quick thanks</div>
                </button>

                <button
                  onClick={() => handleDonation(15)}
                  className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">$15</span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 lowercase font-medium">fancy lunch</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 lowercase mt-1">show some extra love</div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
              <h4 className="text-lg font-medium text-zinc-900 dark:text-white lowercase">more options</h4>
              <button
                onClick={() => {
                  // Close settings and open donation modal
                  onOpenChange(false);
                  
                  // Try multiple methods to find and trigger the donation modal
                  setTimeout(() => {
                    // Method 1: Try to find the donate button
                    let donateButton = document.querySelector('[data-donate-button]') as HTMLButtonElement;
                    
                    if (donateButton) {
                      donateButton.click();
                      return;
                    }
                    
                    // Method 2: Dispatch a custom event that the donation section can listen to
                    const openDonationEvent = new CustomEvent('openDonationModal');
                    window.dispatchEvent(openDonationEvent);
                    
                    // Method 3: Try to navigate to daily page if not already there
                    if (!window.location.pathname.includes('daily')) {
                      window.location.href = '/daily';
                      
                      // After navigation, try again
                      setTimeout(() => {
                        donateButton = document.querySelector('[data-donate-button]') as HTMLButtonElement;
                        if (donateButton) {
                          donateButton.click();
                        }
                      }, 500);
                    }
                  }, 300);
                }}
                className="w-full bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white border-2 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-xl py-4 px-6 text-base font-medium lowercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>view all donation options</span>
                </div>
              </button>
              
              <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed lowercase text-center">
                  💝 every contribution helps keep typrr running and improving
                </p>
              </div>
            </div>
          </div>
        );

      case 'discord':
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <MessageCircle className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white lowercase">
                  join our community
                </h3>
              </div>
              
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed lowercase">
                connect with other developers, share typing tips, get help, and chat about coding. our community is friendly, active, and always ready to help.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-blue-500/10 rounded-2xl p-8 border border-indigo-500/20 shadow-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white lowercase mb-2">typrr community</h4>
                <p className="text-base text-zinc-600 dark:text-zinc-400 lowercase leading-relaxed">
                  active developers • helpful community • coding discussions • typing tips
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">500+</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">members</div>
                </div>
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">24/7</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">active</div>
                </div>
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">dev</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">focused</div>
                </div>
              </div>

              <a 
                href="https://discord.gg/ycKUZAES5h" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-4 px-6 text-base font-medium lowercase transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                <span>join discord server</span>
              </a>
            </div>
            
            <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-base font-medium text-zinc-900 dark:text-white lowercase mb-3">what you'll find</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-zinc-600 dark:text-zinc-400 lowercase">typing challenges & competitions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-zinc-600 dark:text-zinc-400 lowercase">keyboard & setup discussions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-zinc-600 dark:text-zinc-400 lowercase">coding practice tips</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-zinc-600 dark:text-zinc-400 lowercase">feature requests & feedback</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Info className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white lowercase">
                  about typrr
                </h3>
              </div>
              
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed lowercase">
                typrr is a modern typing practice platform designed specifically for developers. 
                improve your coding speed and accuracy with real code snippets from popular programming languages.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white lowercase mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>core features</span>
                </h4>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 lowercase">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>daily coding challenges with fresh content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>practice mode with 15+ programming languages</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>tricky characters training for special symbols</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>detailed typing analytics & progress tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>global leaderboards & competitive typing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>github authentication & profile integration</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white lowercase mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>our values</span>
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm font-bold">🚀</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white lowercase">performance focused</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">lightning fast, minimal, efficient</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm font-bold">🔒</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white lowercase">privacy first</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">no tracking, no ads, no data mining</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm font-bold">💝</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white lowercase">community driven</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">built by developers, for developers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-700 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">❤️</span>
                </div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white lowercase mb-2">
                  made with love for developers
                </h4>
                <p className="text-base text-zinc-600 dark:text-zinc-400 lowercase leading-relaxed max-w-md mx-auto">
                  typrr is a passion project created to help developers improve their typing skills and coding efficiency.
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-zinc-500 dark:text-zinc-400 lowercase">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full"></span>
                  <span>open source</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full"></span>
                  <span>privacy focused</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full"></span>
                  <span>forever free</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1000px] max-w-[90vw] h-[700px] max-h-[85vh] mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="px-12 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/60 mb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-zinc-900 dark:text-white lowercase tracking-wide leading-tight ml-4 mt-1">
              settings
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(100%-72px)]">
          {/* Left Sidebar - Tabs */}
          <div className="w-72 bg-zinc-50/80 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700 p-6">
            <nav className="space-y-3">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 text-left group",
                      activeTab === tab.id
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-600"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/40 hover:shadow-sm"
                    )}
                  >
                    <IconComponent className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      activeTab === tab.id 
                        ? "text-current" 
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                    )} />
                    <span className="lowercase font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Sidebar Footer */}
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 lowercase mb-1">typrr settings</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 lowercase">v1.0</p>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-white/50 to-zinc-50/50 dark:from-zinc-900/50 dark:to-zinc-800/30">
            <div className="max-w-2xl">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
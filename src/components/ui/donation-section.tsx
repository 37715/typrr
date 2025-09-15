import React, { useState, useEffect, useRef } from 'react';
import { Heart, Coffee, Pizza, Gift, Crown, Sparkles, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { stripePromise, createCheckoutSession } from '../../lib/stripe';

const oneTimeDonationOptions = [
  { amount: 5, description: 'cup of coffee', icon: Coffee },
  { amount: 10, description: 'full size pizza', icon: Pizza },
  { amount: 15, description: 'fancy lunch', icon: Gift },
  { amount: 30, description: 'lunch for two', icon: Heart },
  { amount: 50, description: '10kg of cat food', icon: Heart },
  { amount: 100, description: 'one year of domains', icon: Crown },
  
  { amount: 200, description: 'air fryer', icon: Sparkles },
  { amount: 500, description: 'fancy office chair', icon: Crown },
  { amount: 1599, description: 'base macbook pro', icon: Sparkles },
  { amount: 7398, description: 'maxed out macbook pro', icon: Crown },
  { amount: 8629, description: 'a small plot of land', icon: Gift },
  { amount: 9433, description: 'luxury hot tub', icon: Sparkles },
];

const recurringDonationOptions = [
  { amount: 2, description: 'fancy coffee monthly', icon: Coffee },
  { amount: 5, description: 'netflix subscription', icon: Pizza },
  { amount: 10, description: 'spotify family', icon: Gift },
  { amount: 25, description: 'gym membership', icon: Heart },
  
  { amount: 50, description: 'phone bill', icon: Crown },
  { amount: 100, description: 'grocery budget', icon: Sparkles },
  { amount: 200, description: 'car payment', icon: Crown },
  { amount: 500, description: 'rent money', icon: Gift },
];

export const DonationSection: React.FC = () => {
  const [currentSet, setCurrentSet] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
  const donationOptions = donationType === 'one-time' ? oneTimeDonationOptions : recurringDonationOptions;
  
  const setsCount = Math.ceil(donationOptions.length / 3);
  const currentOptions = donationOptions.slice(currentSet * 3, (currentSet + 1) * 3);
  
  const nextSet = () => {
    const nextIndex = currentSet + 1;
    if (nextIndex < setsCount) {
      setCurrentSet(nextIndex);
    }
  };
  
  const prevSet = () => {
    if (currentSet > 0) {
      setCurrentSet(currentSet - 1);
    }
  };

  // Reset currentSet when switching donation types
  useEffect(() => {
    setCurrentSet(0);
  }, [donationType]);
  
  const handleDonation = async (amount: number) => {
    try {
      const session = await createCheckoutSession(amount, donationType);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      // You could add a toast notification here for better UX
    }
  };
  
  const handleCustomDonation = async () => {
    if (customAmount && Number(customAmount) >= 2) {
      await handleDonation(Number(customAmount));
    }
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsModalClosing(false);
    }, 500);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Listen for custom event to open donation modal
    const handleOpenDonationModal = () => {
      setShowModal(true);
      setIsModalOpening(true);
      setTimeout(() => setIsModalOpening(false), 100);
    };

    window.addEventListener('openDonationModal', handleOpenDonationModal);

    return () => {
      observer.disconnect();
      window.removeEventListener('openDonationModal', handleOpenDonationModal);
    };
  }, []);

  return (
    <div 
      ref={sectionRef}
      className={`text-white flex flex-col items-center px-4 py-8 transition-opacity duration-1000 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Subtle header */}
      <div className="text-center mb-6">
        <p className="text-base md:text-lg text-zinc-700 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed lowercase">
          help keep typrr fast, clean, and ad-free forever
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-500 max-w-2xl mx-auto leading-relaxed lowercase mt-2">
          every donation helps maintain the servers and improve the experience for everyone
        </p>
      </div>

      {/* Animated Donate Button */}
      <div className="flex justify-center mb-8">
        <button
          data-donate-button
          onClick={() => {
            setShowModal(true);
            setIsModalOpening(true);
            setTimeout(() => setIsModalOpening(false), 100);
          }}
          className="group relative bg-white text-black px-10 py-3 rounded-xl font-medium text-base lowercase hover:bg-zinc-100 transition-all duration-300 hover:scale-105 active:scale-95 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-md dark:shadow-lg overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-red-500/10 to-pink-500/10 dark:from-pink-500/20 dark:via-red-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Heart icon with animation */}
          <div className="relative flex items-center justify-center">
            <Heart className="w-4 h-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-red-500 group-hover:animate-pulse" />
            <span className="relative z-10">donate</span>
          </div>
          
          {/* Floating hearts animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping">
              <Heart className="w-3 h-3 text-red-400" />
            </div>
            <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-all duration-700 delay-100 group-hover:animate-ping">
              <Heart className="w-2 h-2 text-pink-400" />
            </div>
            <div className="absolute top-2/3 right-1/3 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-all duration-700 delay-200 group-hover:animate-ping">
              <Heart className="w-2 h-2 text-red-300" />
            </div>
          </div>
        </button>
      </div>

      {/* Donation Modal */}
      {showModal && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-500 ease-out ${
            isModalClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`bg-zinc-900/95 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700 transition-all duration-500 ease-out ${
              isModalClosing 
                ? 'opacity-0 scale-90' 
                : 'opacity-100 scale-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold lowercase text-white">support typrr</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* One-time vs Recurring tabs */}
            <div className="flex justify-center mb-6">
              <div className="bg-zinc-800 rounded-2xl p-2 flex">
                <button 
                  onClick={() => { setDonationType('one-time'); setCurrentSet(0); }}
                  className={`px-6 py-3 rounded-xl font-semibold lowercase transition-all ${
                    donationType === 'one-time' 
                      ? 'bg-white text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Gift className="w-5 h-5 inline mr-2" />
                  one-time donation
                </button>
                <button 
                  onClick={() => { setDonationType('recurring'); setCurrentSet(0); }}
                  className={`px-6 py-3 rounded-xl font-semibold lowercase transition-all ${
                    donationType === 'recurring' 
                      ? 'bg-white text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-5 h-5 inline mr-2" />
                  recurring donation
                </button>
              </div>
            </div>

            {/* Donation amounts grid - slider */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 relative">
              <div className="flex items-center justify-between">
                <button 
                  onClick={prevSet}
                  className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 z-10 flex-shrink-0"
                  disabled={currentSet === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="relative flex-1 mx-4 overflow-hidden py-4">
                  <div 
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ 
                      transform: `translateX(-${currentSet * (100 / setsCount)}%)`,
                      width: `${setsCount * 100}%` 
                    }}
                  >
                    {Array.from({ length: setsCount }).map((_, setIndex) => (
                      <div
                        key={setIndex}
                        className="grid grid-cols-3 gap-4 w-full px-3 flex-shrink-0"
                        style={{ width: `${100 / setsCount}%` }}
                      >
                        {donationOptions.slice(setIndex * 3, (setIndex + 1) * 3).map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.amount}
                              onClick={() => handleDonation(option.amount)}
                              className="group bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 hover:from-zinc-700/70 hover:to-zinc-800/70 rounded-xl p-5 transition-all duration-300 hover:scale-105 active:scale-95 border border-zinc-600/50 hover:border-zinc-500/70 min-h-[110px] hover:z-10 relative backdrop-blur-sm hover:shadow-lg"
                            >
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="p-2 rounded-full bg-zinc-700/50 group-hover:bg-zinc-600/50 transition-colors">
                                  <IconComponent className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-lg font-bold text-white lowercase">${option.amount}</div>
                                <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors lowercase leading-relaxed">
                                  {option.description}
                                </div>
                              </div>
                              
                              {/* Subtle shine effect */}
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={nextSet}
                  className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 z-10 flex-shrink-0"
                  disabled={currentSet >= setsCount - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Custom amount */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-zinc-400 lowercase">custom amount (from $2)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xl text-white">$</span>
                  <input
                    type="number"
                    min="2"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={handleCustomDonation}
                    disabled={!customAmount || Number(customAmount) < 2}
                    className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                  >
                    donate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer message */}
      <div className="text-center max-w-2xl">
        <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed lowercase">
          typrr helps developers improve their coding speed and accuracy
        </p>
        <p className="text-zinc-700 dark:text-zinc-600 mt-1 text-xs lowercase">
          made with love, not for profit
        </p>
      </div>

      {/* Discord Invitation */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-xl px-6 py-4 border border-zinc-300/50 dark:border-zinc-700/50 hover:border-zinc-400/50 dark:hover:border-zinc-600/50 transition-all duration-300 group">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500/30 transition-colors">
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-900 dark:text-white lowercase">join our community</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 lowercase">chat, share tips, and connect with other typers</p>
          </div>
          <a 
            href="https://discord.gg/ycKUZAES5h" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium lowercase transition-all duration-200 hover:scale-105 active:scale-95"
          >
            join discord
          </a>
        </div>
      </div>
    </div>
  );
};
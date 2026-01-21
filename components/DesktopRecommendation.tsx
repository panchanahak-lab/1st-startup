
import React, { useState, useEffect } from 'react';

const DesktopRecommendation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const isMobile = window.innerWidth < 1024;
      const isDismissed = localStorage.getItem('nextstep_desktop_hint_dismissed');
      
      if (isMobile && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial check
    checkVisibility();

    // Re-check on resize
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('nextstep_desktop_hint_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-md z-[9995] animate-reveal print:hidden">
      <div className="bg-white dark:bg-navy-900 border-2 border-brand-500 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        {/* Animated Glow Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400 animate-shimmer"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 group-hover:rotate-12 transition-transform">
            <i className="fas fa-display text-xl"></i>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-1">
              Optimization Alert
            </h4>
            <p className="text-xs text-navy-900 dark:text-slate-200 leading-normal font-bold">
              Switch to <span className="text-brand-500">Desktop Mode</span> for the full Neural Simulation and CV Engine experience.
            </p>
          </div>

          <button 
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Dismiss recommendation"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopRecommendation;

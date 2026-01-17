
import React, { useState, useEffect } from 'react';

type ConsentCategory = 'essential' | 'analytics' | 'functional' | 'advertising';

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  advertising: boolean;
}

const STORAGE_KEY = 'nextstep_cookie_consent'; // Updated key
const EXPIRY_DAYS = 180;

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Default State: Only Essential is true, others false
  const [consent, setConsent] = useState<ConsentState>({
    essential: true,
    analytics: false,
    functional: false,
    advertising: false,
  });

  useEffect(() => {
    // 1. Check for existing consent
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const { timestamp, preferences } = JSON.parse(stored);
        const now = new Date().getTime();
        const daysPassed = (now - timestamp) / (1000 * 60 * 60 * 24);

        if (daysPassed < EXPIRY_DAYS) {
          setConsent(preferences);
          handleScriptLoading(preferences);
          return; // Valid consent exists, don't show banner
        }
      } catch (e) {
        console.error("Cookie consent parse error", e);
      }
    }

    // 2. If no valid consent, show banner (delay for animation)
    const timer = setTimeout(() => setShowBanner(true), 1500);
    
    // 3. Listen for Footer link click
    const openHandler = () => setShowModal(true);
    window.addEventListener('open-cookie-preferences', openHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-cookie-preferences', openHandler);
    };
  }, []);

  const handleScriptLoading = (preferences: ConsentState) => {
    // CONDITIONAL LOADING: Google Analytics
    if (preferences.analytics) {
      // Check if GA is already loaded to prevent duplicates
      if (!document.getElementById('nextstep-ga-script')) {
        const script1 = document.createElement('script');
        script1.id = 'nextstep-ga-script';
        script1.async = true;
        // Replace G-XXXXXXXXXX with your actual Measurement ID
        script1.src = `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`; 
        
        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `;
        
        document.head.appendChild(script1);
        document.head.appendChild(script2);
        console.log("NextStep Resume: Analytics initialized.");
      }
    }
    
    // Future: Load Stripe fraud detection if 'functional' or 'essential' requires it contextually
    // Future: Load Ad pixels if 'advertising' is true
  };

  const savePreferences = (newPreferences: ConsentState) => {
    const data = {
      timestamp: new Date().getTime(),
      preferences: newPreferences
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsent(newPreferences);
    handleScriptLoading(newPreferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      functional: true,
      advertising: true
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true, // Always true
      analytics: false,
      functional: false,
      advertising: false
    });
  };

  const handleToggle = (category: ConsentCategory) => {
    if (category === 'essential') return; // Locked
    setConsent(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSaveModal = () => {
    savePreferences(consent);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* --- BANNER --- */}
      {showBanner && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-reveal">
          <div className="max-w-7xl mx-auto">
            <div className="glass-premium dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center gap-6 md:gap-8 backdrop-blur-xl">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <i className="fas fa-cookie-bite"></i>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Privacy & Transparency</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  At <strong>NextStep Resume</strong>, we value your privacy. We use cookies to secure your sessions and, with your permission, to analyze traffic to improve our tools. We comply with the <span className="text-navy-900 dark:text-slate-100 font-bold">DPDP Act, 2023</span>.
                </p>
                <div className="mt-2">
                  <a href="/privacy" className="text-xs font-bold text-brand-500 hover:text-brand-600 underline decoration-brand-500/30 underline-offset-4">Read our Privacy Policy</a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Preferences
                </button>
                <button 
                  onClick={handleRejectNonEssential}
                  className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-navy-900 dark:text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Reject Optional
                </button>
                <button 
                  onClick={handleAcceptAll}
                  className="px-8 py-3 rounded-xl bg-navy-900 dark:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PREFERENCES MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-navy-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-reveal flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-navy-950 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">Cookie Preferences</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">NextStep Resume • Odisha, India</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Customize your consent settings. Essential cookies are required for the application to function (e.g., login sessions), while others help us improve NextStep Resume.
              </p>

              {/* Essential */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 opacity-75">
                <div className="mt-1">
                  <i className="fas fa-lock text-slate-400"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-navy-900 dark:text-white">Essential Cookies</h4>
                    <span className="text-[10px] font-black uppercase text-brand-500 bg-brand-500/10 px-2 py-1 rounded">Always Active</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Necessary for the website to function. Includes session tokens, security verification (Stripe), and preventing fraud.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="mt-1">
                  <i className="fas fa-chart-bar text-brand-500"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-navy-900 dark:text-white">Analytics</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={consent.analytics} onChange={() => handleToggle('analytics')} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Helps us understand how you use the tools (via Google Analytics) so we can improve performance and features. Data is anonymized.
                  </p>
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="mt-1">
                  <i className="fas fa-sliders-h text-brand-500"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-navy-900 dark:text-white">Functional</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={consent.functional} onChange={() => handleToggle('functional')} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Stores your UI preferences (like Dark Mode settings) and editor configurations across visits.
                  </p>
                </div>
              </div>

              {/* Advertising */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="mt-1">
                  <i className="fas fa-bullseye text-brand-500"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-navy-900 dark:text-white">Marketing</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={consent.advertising} onChange={() => handleToggle('advertising')} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Allows us to show relevant offers for NextStep Resume Premium. We do not sell your data to third-party data brokers.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-white/5 flex flex-col-reverse sm:flex-row gap-4 justify-end shrink-0">
               <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-navy-900 dark:hover:text-white transition-colors"
               >
                 Cancel
               </button>
               <button 
                  onClick={handleSaveModal}
                  className="px-8 py-3 rounded-xl bg-navy-900 dark:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all"
               >
                 Save Preferences
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;

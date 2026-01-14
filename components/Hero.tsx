
import React from 'react';

const Hero: React.FC = () => {
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const startTour = () => {
    window.dispatchEvent(new CustomEvent('start-nextstep-tour'));
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 lg:pt-60 lg:pb-48 overflow-hidden">
      {/* Dynamic Aura Orbs */}
      <div className="aura-orb bg-brand-500 top-[-10%] right-[-10%] md:top-[-20%] md:right-[-10%] animate-aura"></div>
      <div className="aura-orb bg-accent-purple bottom-[-10%] left-[-10%] md:bottom-[-20%] md:left-[-10%] animate-aura" style={{ animationDelay: '-5s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          <div id="hero-badge" className="animate-reveal inline-flex items-center gap-2 bg-white/10 dark:bg-white/5 border border-white/20 px-4 py-2 md:px-6 md:py-2 rounded-full mb-8 md:mb-12 shadow-xl backdrop-blur-md">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-navy-900 dark:text-brand-400">
              Intelligence-Driven Career Suite
            </span>
          </div>
          
          <h1 className="animate-reveal [animation-delay:100ms] text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-navy-900 dark:text-white leading-[1] md:leading-[0.85] tracking-[-0.05em] mb-8 md:mb-12 max-w-6xl">
            Land The <br className="hidden sm:block"/> <span className="text-gradient">Dream Offer.</span>
          </h1>
          
          <p className="animate-reveal [animation-delay:200ms] text-lg md:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 md:mb-16 leading-relaxed font-medium px-4">
            AI-powered resume optimization, real-time interview simulations, and high-impact LinkedIn branding—engineered for 1% results.
          </p>
          
          <div className="animate-reveal [animation-delay:300ms] flex flex-col sm:flex-row gap-4 md:gap-6 items-center w-full sm:w-auto px-6 sm:px-0">
            <button 
              onClick={() => scrollToId('ats-checker')}
              className="w-full sm:w-auto btn-premium group bg-navy-900 dark:bg-brand-500 text-white font-black text-lg md:text-xl px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl"
            >
              Scan Your CV
              <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
            </button>
            <button 
              onClick={() => scrollToId('builder')}
              className="w-full sm:w-auto glass-premium dark:bg-white/5 text-navy-900 dark:text-white font-bold text-lg md:text-xl px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-xl"
            >
              Launch Builder
            </button>
          </div>

          <button 
            onClick={startTour}
            className="mt-10 md:mt-12 animate-reveal [animation-delay:400ms] text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 hover:text-brand-500 transition-colors flex items-center gap-3"
          >
            <i className="fas fa-play-circle text-lg"></i> Take a Feature Tour
          </button>

          <div className="mt-16 md:mt-24 flex flex-col md:flex-row items-center gap-6 md:gap-8 animate-reveal [animation-delay:500ms]">
            <div className="flex -space-x-3 md:-space-x-4">
              {[12, 14, 16, 18].map(i => (
                <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 md:border-4 border-white dark:border-navy-950 bg-slate-200 overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/100?img=${i}`} alt="Success User" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 md:border-4 border-white dark:border-navy-950 bg-brand-500 flex items-center justify-center text-white text-[10px] md:text-xs font-black shadow-xl">
                +15k
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-black text-navy-900 dark:text-white tracking-tight leading-none mb-1">Elite Professionals</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust NextStep Every Day</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

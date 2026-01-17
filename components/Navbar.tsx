
import React, { useState } from 'react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed w-full z-[60] glass border-b border-slate-200/50 dark:border-white/5 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-7 h-7 md:w-9 md:h-9 bg-brand-500 rounded-lg md:rounded-xl flex items-center justify-center mr-2 md:mr-3 shadow-lg shadow-brand-500/30 group-hover:rotate-12 transition-transform">
               <i className="fas fa-briefcase text-white text-xs md:text-sm"></i>
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tighter">
              <span className="text-brand-500">NextStep</span>
              <span className="text-navy-900 dark:text-white ml-1">Resume</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">About</a>
            <a href="#ats-checker" onClick={(e) => handleNavClick(e, 'ats-checker')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">Scanner</a>
            <a href="#builder" onClick={(e) => handleNavClick(e, 'builder')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">Builder</a>
            <a href="#interview" onClick={(e) => handleNavClick(e, 'interview')} className="text-brand-500 font-bold flex items-center gap-2 text-sm lg:text-base">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Interview Prep
            </a>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={onToggleTheme}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-brand-500 hover:text-white transition-all text-slate-600 dark:text-slate-300"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
              </button>

              <button 
                onClick={() => onOpenAuth('signin')}
                className="text-navy-900 dark:text-slate-200 hover:text-brand-500 font-bold px-3 py-2 text-sm lg:text-base"
              >
                Login
              </button>
              <button 
                onClick={() => onOpenAuth('signup')}
                className="btn-shimmer bg-navy-900 dark:bg-brand-600 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-bold shadow-xl transition-transform hover:scale-105 active:scale-95 text-sm lg:text-base"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={onToggleTheme} 
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm"
              aria-label="Toggle Theme"
            >
               {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 dark:text-slate-300 focus:outline-none p-2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5"
              aria-label="Toggle Menu"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 z-[-1] transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-screen w-[280px] bg-white dark:bg-navy-950 shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="p-6 pt-24 space-y-6">
              <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="flex items-center gap-4 py-3 text-lg font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors">
                <i className="fas fa-circle-info w-6 text-brand-500"></i> About
              </a>
              <a href="#ats-checker" onClick={(e) => handleNavClick(e, 'ats-checker')} className="flex items-center gap-4 py-3 text-lg font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors">
                <i className="fas fa-magnifying-glass-chart w-6 text-brand-500"></i> Scanner
              </a>
              <a href="#builder" onClick={(e) => handleNavClick(e, 'builder')} className="flex items-center gap-4 py-3 text-lg font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors">
                <i className="fas fa-file-invoice w-6 text-brand-500"></i> Builder
              </a>
              <a href="#interview" onClick={(e) => handleNavClick(e, 'interview')} className="flex items-center gap-4 py-3 text-lg font-bold text-brand-500 transition-colors">
                <i className="fas fa-microphone-lines w-6"></i> Interview Prep
              </a>
              
              <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                 <button 
                  onClick={() => { onOpenAuth('signin'); setIsOpen(false); }} 
                  className="w-full py-4 rounded-xl font-bold border border-slate-200 dark:border-white/10 dark:text-white"
                 >
                  Login
                 </button>
                 <button 
                  onClick={() => { onOpenAuth('signup'); setIsOpen(false); }} 
                  className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold shadow-lg"
                 >
                  Get Started
                 </button>
              </div>
           </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

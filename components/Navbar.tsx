
import React, { useState, useEffect } from 'react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

import { useAuth } from '../lib/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme, onOpenAuth }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when resizing to desktop to prevent layout issues
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

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
    } else {
      // If element is not found (e.g., we are on Dashboard), navigate to home with hash
      navigate(`/#${id}`);
      // We might need a setTimeout to allow navigation to complete before scrolling, 
      // but react-router usually handles hash links well if configured or we can rely on LandingPage to scroll on mount if we wanted to get fancy.
      // For now, basic navigation is better than broken buttons.
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed w-full z-[2000] bg-white/90 dark:bg-navy-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div
            className="flex-shrink-0 flex items-center cursor-pointer group"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}
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
            <a href="/#about" onClick={(e) => handleNavClick(e, 'about')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">About</a>
            <a href="/#ats-checker" onClick={(e) => handleNavClick(e, 'ats-checker')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">Scanner</a>
            <a href="/#builder" onClick={(e) => handleNavClick(e, 'builder')} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 font-semibold transition-colors text-sm lg:text-base">Builder</a>
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

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-navy-900 dark:text-slate-200 hover:text-brand-500 font-bold px-3 py-2 text-sm lg:text-base"
                  >
                    Account
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                      // Force reload to ensure clean state if needed
                      window.location.reload();
                    }}
                    className="btn-shimmer bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95 text-sm lg:text-base"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 p-2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 transition-all"
              aria-label={isOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={isOpen}
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[-1] transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        ></div>

        <div
          className={`absolute top-0 right-0 h-screen w-[85%] max-w-[300px] bg-white dark:bg-navy-950 shadow-2xl transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 pt-24 space-y-2 flex-grow overflow-y-auto">
              {/* Menu Items with staggered animation */}
              {[
                { id: 'about', icon: 'fa-circle-info', label: 'About' },
                { id: 'ats-checker', icon: 'fa-magnifying-glass-chart', label: 'Scanner' },
                { id: 'builder', icon: 'fa-file-invoice', label: 'Builder' },
                { id: 'interview', icon: 'fa-microphone-lines', label: 'Interview Prep', highlight: true }
              ].map((item, idx) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`flex items-center gap-4 py-4 px-4 rounded-xl text-lg font-bold transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                    } ${item.highlight ? 'text-brand-500 bg-brand-500/5' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-500'}`}
                  style={{ transitionDelay: `${100 + idx * 50}ms` }}
                >
                  <i className={`fas ${item.icon} w-8 text-center ${item.highlight ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'}`}></i>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5 space-y-4 bg-slate-50/50 dark:bg-navy-900/50">
              {user ? (
                <button
                  onClick={async () => {
                    await signOut();
                    setIsOpen(false);
                    navigate('/');
                    window.location.reload();
                  }}
                  className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { onOpenAuth('signin'); setIsOpen(false); }}
                    className="w-full py-4 rounded-xl font-bold border border-slate-200 dark:border-white/10 text-navy-900 dark:text-white hover:bg-white dark:hover:bg-white/5 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { onOpenAuth('signup'); setIsOpen(false); }}
                    className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/25 transition-all active:scale-95"
                  >
                    Get Started
                  </button>
                </>
              )}

              <p className="text-center text-[10px] uppercase font-bold text-slate-400 tracking-widest pt-2">
                NextStep Resume v2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

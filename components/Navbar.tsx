
import React, { useState } from 'react';

interface NavbarProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <span className="font-heading font-bold text-2xl tracking-tight">
              <span className="text-brand-500">Next</span>
              <span className="text-brand-500">Step</span>
              <span className="text-navy-900 ml-1">Resume</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#ats-checker" className="text-slate-600 hover:text-navy-900 font-medium transition-colors">Scanner</a>
            <a href="#builder" className="text-slate-600 hover:text-navy-900 font-medium transition-colors">Builder</a>
            <a href="#tracker" className="text-slate-600 hover:text-navy-900 font-medium transition-colors">Tracker</a>
            <a href="#interview" className="text-brand-600 font-semibold transition-colors flex items-center">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Interview Prep
            </a>
            <div className="flex items-center space-x-4 ml-4">
              <button 
                onClick={() => onOpenAuth('signin')}
                className="text-navy-900 hover:text-brand-500 font-semibold transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => onOpenAuth('signup')}
                className="bg-navy-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-navy-900 focus:outline-none p-2"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <a href="#ats-checker" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-navy-900 hover:bg-slate-50" onClick={() => setIsOpen(false)}>Scanner</a>
            <a href="#builder" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-navy-900 hover:bg-slate-50" onClick={() => setIsOpen(false)}>Builder</a>
            <a href="#tracker" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-navy-900 hover:bg-slate-50" onClick={() => setIsOpen(false)}>Tracker</a>
            <a href="#interview" className="block px-3 py-3 rounded-md text-base font-medium text-brand-600 bg-brand-50 hover:bg-brand-100" onClick={() => setIsOpen(false)}>Interview Prep</a>
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setIsOpen(false); onOpenAuth('signin'); }}
                className="w-full text-center py-3 rounded-lg font-semibold text-navy-900 border border-slate-200 hover:bg-slate-50"
              >
                Log In
              </button>
              <button 
                onClick={() => { setIsOpen(false); onOpenAuth('signup'); }}
                className="w-full bg-navy-900 text-white px-5 py-3 rounded-lg font-medium shadow-md hover:bg-slate-800"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

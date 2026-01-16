
import React from 'react';

const Footer: React.FC = () => {
  const openCookiePreferences = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 dark:bg-navy-950 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <span className="font-heading font-bold text-xl tracking-tight">
              <span className="text-brand-500">Ramya</span>
              <span className="text-navy-900 dark:text-white ml-1">PDF</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">© {new Date().getFullYear()} Ramya PDF. All rights reserved.</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-widest font-bold">Made in Odisha, India</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
             <a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a>
             <button onClick={openCookiePreferences} className="hover:text-brand-500 transition-colors">Cookie Preferences</button>
          </div>

          <div className="flex space-x-6">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
              <i className="fab fa-facebook text-xl"></i>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
              <i className="fab fa-instagram text-xl"></i>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
              <i className="fab fa-linkedin text-xl"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import React, { useState, useEffect } from 'react';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 left-6 md:bottom-8 md:left-8 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-brand-500 shadow-xl flex items-center justify-center transition-all duration-500 transform hover:bg-brand-500 hover:text-white hover:-translate-y-2 hover:shadow-2xl print:hidden ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
      }`}
      aria-label="Back to Top"
    >
      <i className="fas fa-arrow-up text-lg md:text-xl"></i>
    </button>
  );
};

export default BackToTop;

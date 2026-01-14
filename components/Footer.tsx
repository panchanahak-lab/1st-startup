import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-heading font-bold text-xl tracking-tight">
              <span className="text-brand-500">Next</span>
              <span className="text-brand-500">Step</span>
              <span className="text-navy-900 ml-1">Resume</span>
            </span>
            <p className="text-slate-500 text-sm mt-1">© {new Date().getFullYear()} NextStep Resume. All rights reserved.</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
              <i className="fab fa-facebook text-xl"></i>
            </a>
            <a href="https://www.instagram.com/nexttstepresume/#" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
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
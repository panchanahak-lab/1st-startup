
import React from 'react';

const Hero: React.FC = () => {
  const scrollToBuilder = () => {
    const builderSection = document.getElementById('builder');
    if (builderSection) {
      builderSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-28 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-tight mb-6">
              Your <span className="text-brand-500">Next</span> <span className="text-brand-500">Step</span> Starts With the <span className="text-brand-500 relative">
                Right Resume
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              ATS-optimized resumes tailored to your job role — not generic templates. Get hired faster with a CV designed to impress both bots and humans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={scrollToBuilder}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-brand-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                Get Your Resume Now <i className="fas fa-arrow-right ml-2 text-sm"></i>
              </button>
              <button className="bg-white hover:bg-slate-50 text-navy-900 font-semibold text-lg px-8 py-4 rounded-xl shadow-md border border-slate-200 transition-all duration-300">
                View Samples
              </button>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center"><i className="fas fa-check-circle text-brand-500 mr-2"></i> 24h Turnaround</span>
              <span className="flex items-center"><i className="fas fa-check-circle text-brand-500 mr-2"></i> Satisfaction Guaranteed</span>
            </div>
          </div>

          {/* Visual: CSS Resume Mockup */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-full perspective-1000 mt-8 lg:mt-0">
            {/* Decorative background blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            {/* Resume Card */}
            <div className="relative bg-white rounded-lg shadow-2xl p-6 sm:p-8 transform transition-all duration-700 ease-out border border-slate-100 md:rotate-y-6 md:rotate-x-6 hover:rotate-0">
              {/* Resume Header */}
              <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex-shrink-0 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-navy-900 rounded w-3/4"></div>
                  <div className="h-4 bg-brand-500 rounded w-1/2"></div>
                </div>
              </div>
              
              {/* Resume Body */}
              <div className="space-y-6">
                {/* Experience Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                      <i className="fas fa-briefcase text-xs"></i>
                    </div>
                    <div className="h-5 bg-slate-800 rounded w-1/3"></div>
                  </div>
                  <div className="pl-10 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                  </div>
                </div>

                 {/* Education Section */}
                 <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                      <i className="fas fa-graduation-cap text-xs"></i>
                    </div>
                    <div className="h-5 bg-slate-800 rounded w-1/4"></div>
                  </div>
                  <div className="pl-10 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                      <i className="fas fa-bolt text-xs"></i>
                    </div>
                     <div className="h-5 bg-slate-800 rounded w-1/4"></div>
                  </div>
                   <div className="pl-10 flex flex-wrap gap-2">
                    <div className="h-6 bg-brand-100 rounded-full w-16"></div>
                    <div className="h-6 bg-brand-100 rounded-full w-20"></div>
                    <div className="h-6 bg-brand-100 rounded-full w-14"></div>
                    <div className="h-6 bg-brand-100 rounded-full w-24"></div>
                  </div>
                </div>
              </div>

              {/* Hired Badge */}
              <div className="absolute -right-6 -bottom-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce-slow z-20">
                 <div className="bg-brand-100 text-brand-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-lg"></i>
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
                    <p className="font-bold text-navy-900">Hired!</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

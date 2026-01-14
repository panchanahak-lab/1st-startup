import React from 'react';
import { ServiceItem } from '../types';

const services: ServiceItem[] = [
  {
    title: 'Resume/CV Writing',
    icon: 'fas fa-file-alt',
    description: 'Comprehensive rewrite of your CV focusing on achievements, metrics, and relevant keywords to boost visibility.',
  },
  {
    title: 'Cover Letter Drafting',
    icon: 'fas fa-envelope-open-text',
    description: 'Compelling narratives that explain your career transitions and highlight your passion for the prospective role.',
  },
  {
    title: 'LinkedIn Optimization',
    icon: 'fab fa-linkedin',
    description: 'Transform your profile into a magnet for recruiters with optimized headlines, summaries, and skill sections.',
  },
];

const Services: React.FC = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Height of fixed navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="services" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-brand-500 font-semibold tracking-wide uppercase text-sm">Our Expertise</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-900 mt-2 mb-6">Everything You Need to Get Hired</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">We provide a full suite of career marketing documents designed to work together cohesively.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 transform hover:-translate-y-2 group"
            >
              <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center text-brand-500 mb-6 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <i className={`${service.icon} text-2xl`}></i>
              </div>
              <h3 className="font-heading text-xl font-bold text-navy-900 mb-4">{service.title}</h3>
              <p className="text-slate-600 leading-relaxed mb-6">{service.description}</p>
              
              {service.title === 'LinkedIn Optimization' ? (
                <a 
                  href="#linkedin-optimizer" 
                  onClick={(e) => handleNavClick(e, 'linkedin-optimizer')}
                  className="text-[#0A66C2] font-semibold text-sm flex items-center hover:opacity-80 transition-opacity"
                >
                  Optimize My Profile <i className="fas fa-magic ml-2 text-xs"></i>
                </a>
              ) : service.title === 'Cover Letter Drafting' ? (
                <a 
                  href="#builder" 
                  onClick={(e) => handleNavClick(e, 'builder')}
                  className="text-navy-900 font-semibold text-sm flex items-center group-hover:text-brand-500 transition-colors"
                >
                  Draft Cover Letter <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              ) : (
                <a 
                  href="#builder" 
                  onClick={(e) => handleNavClick(e, 'builder')}
                  className="text-navy-900 font-semibold text-sm flex items-center group-hover:text-brand-500 transition-colors"
                >
                  Start Building <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
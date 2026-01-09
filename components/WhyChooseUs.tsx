import React from 'react';
import { TrustIndicator } from '../types';

const features: TrustIndicator[] = [
  {
    icon: 'fa-robot',
    title: 'ATS-Friendly Architecture',
    description: 'Optimized formatting ensuring your resume parses perfectly through automated screening systems.',
  },
  {
    icon: 'fa-user-tie',
    title: 'Tailored to Your Role',
    description: 'We don’t use cookie-cutter text. Every bullet point is crafted for your specific industry level.',
  },
  {
    icon: 'fa-certificate',
    title: 'Recruiter Approved',
    description: 'Layouts and content strategies designed based on direct feedback from HR professionals.',
  },
  {
    icon: 'fa-columns',
    title: 'Modern Clean Layouts',
    description: 'Aesthetically pleasing designs that utilize whitespace to maximize readability and impact.',
  },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-4">Why NextStep Resume?</h2>
          <div className="w-20 h-1 bg-brand-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group p-6 rounded-2xl hover:bg-slate-50 transition-colors duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center text-navy-900 group-hover:bg-navy-900 group-hover:text-brand-400 transition-all duration-300 transform group-hover:-rotate-3 shadow-sm">
                <i className={`fas ${feature.icon} text-2xl`}></i>
              </div>
              <h3 className="font-heading font-semibold text-lg text-navy-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
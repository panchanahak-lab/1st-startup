
import React from 'react';
import { TrustIndicator } from '../types';

import { supabase } from '../lib/supabaseClient';

const WhyChooseUs: React.FC = () => {
  const [features, setFeatures] = React.useState<TrustIndicator[]>([]);

  React.useEffect(() => {
    const fetchFeatures = async () => {
      const { data, error } = await supabase
        .from('trust_indicators')
        .select('*');

      if (error) {
        console.error('Error fetching features:', error);
      } else {
        setFeatures(data || []);
      }
    };

    fetchFeatures();
  }, []);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-4">Why This Platform Is Different</h2>
          <div className="w-20 h-1 bg-brand-500 mx-auto rounded-full"></div>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Built specifically for the Indian job market to help you crack interviews at top MNCs and Startups.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group p-6 rounded-2xl hover:bg-slate-50 transition-colors duration-300 border border-transparent hover:border-slate-100">
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

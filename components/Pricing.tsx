import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Pricing: React.FC = () => {
  const [features, setFeatures] = useState<string[]>([]);

  useEffect(() => {
    const fetchFeatures = async () => {
      const { data, error } = await supabase
        .from('pricing_features')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching features:', error);
      } else {
        setFeatures(data ? data.map((f: any) => f.feature_text) : []);
      }
    };

    fetchFeatures();
  }, []);

  return (
    <section id="pricing" className="py-24 bg-white relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-50 -z-1 skew-y-1 transform origin-top-left"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-navy-900 mb-6">Professional Growth Should Be Free.</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">We believe access to career preparation is a fundamental right, not a premium feature. No credit cards. No hidden fees.</p>
        </div>

        <div className="max-w-4xl mx-auto bg-navy-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <span className="text-brand-400 font-black uppercase tracking-[0.2em] text-sm mb-4 block">The Forever Promise</span>
              <h3 className="text-4xl md:text-6xl font-black text-white mb-6">₹0 <span className="text-2xl font-bold text-slate-400">/ forever</span></h3>
              <p className="text-slate-300 leading-relaxed mb-8">
                Practice as many interviews as you need. Generate unlimited resume audits. We are committed to helping Indian job seekers land their dream roles without financial barriers.
              </p>
              <button
                onClick={() => document.getElementById('interview')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Start Practicing Now
              </button>
            </div>

            <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-3xl p-8">
              <ul className="space-y-4">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-white font-medium">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

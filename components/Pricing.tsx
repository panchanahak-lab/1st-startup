
import React from 'react';
import { PricingTier } from '../types';

const tiers: PricingTier[] = [
  {
    name: 'Fresher',
    price: '₹199',
    features: [
      'ATS-Compliant Structure',
      'Professional Formatting', 
      'Keyword-Optimized Content',
      'Academic Project Highlights',
      '1 revisions'
    ],
    isPopular: false,
  },
  {
    name: 'Professional',
    price: '₹499',
    features: [
      'Advanced ATS Optimization',
      'Custom Cover Letter Drafting',
      'Editable Source Files (Docx/PDF)',
      'Industry-Specific Action Verbs',
      '3 revisions'
    ],
    isPopular: true,
  },
  {
    name: 'Premium',
    price: '₹999',
    features: [
      'All Professional Features',
      'Full LinkedIn Profile Makeover',
      'Role-Specific Competency Mapping',
      'Priority Support (24h TAT)',
      '7 revisions'
    ],
    isPopular: false,
  },
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-white relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-50 -z-1 skew-y-1 transform origin-top-left"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
           <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-900 mb-4">Invest in Your Career</h2>
           <p className="text-slate-600">Transparent pricing. No hidden fees. 10x ROI on your first paycheck.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={index} 
              className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 ${
                tier.isPopular 
                  ? 'border-brand-500 shadow-2xl md:scale-105 z-10' 
                  : 'border-slate-200 shadow-lg hover:border-brand-200'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md whitespace-nowrap">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-slate-600 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center">
                  {tier.name === 'Fresher' && <span className="text-slate-500 text-sm mr-1 font-medium">starting @</span>}
                  <span className="text-4xl font-bold text-navy-900 tracking-tight">{tier.price}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <i className={`fas fa-check-circle mt-1 mr-3 ${tier.isPopular ? 'text-brand-500' : 'text-slate-400'}`}></i>
                    <span className="text-slate-600 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 ${
                  tier.isPopular
                    ? 'bg-navy-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-100 hover:bg-slate-200 text-navy-900'
                }`}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

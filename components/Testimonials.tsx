import React from 'react';
import { TestimonialItem } from '../types';

import { supabase } from '../lib/supabaseClient';

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = React.useState<TestimonialItem[]>([]);

  React.useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*');

      if (error) {
        console.error('Error fetching testimonials:', error);
      } else {
        setTestimonials(data || []);
      }
    };

    fetchTestimonials();
  }, []);
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-4">Success Stories</h2>
          <p className="text-slate-600">Join thousands of professionals who landed their dream jobs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div key={index} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
              <div className="flex text-brand-500 mb-4">
                {[...Array(item.stars)].map((_, i) => (
                  <i key={i} className="fas fa-star text-sm"></i>
                ))}
              </div>
              <p className="text-slate-700 italic mb-6 leading-relaxed">"{item.review}"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm">
                  {item.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-bold text-navy-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
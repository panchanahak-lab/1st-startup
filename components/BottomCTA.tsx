
import React from 'react';

const BottomCTA: React.FC = () => {
  return (
    <section className="bg-navy-900 py-20">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
          Take the Next Step in Your Career Today
        </h2>
        <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
          Don't let a bad resume hold you back from the salary and position you deserve. Let's discuss your profile.
        </p>
        <button className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto">
          <i className="fab fa-whatsapp text-2xl mr-3"></i>
          Chat on WhatsApp
        </button>
      </div>
    </section>
  );
};

export default BottomCTA;

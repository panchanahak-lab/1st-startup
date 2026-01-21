
import React from 'react';

const BottomCTA: React.FC = () => {
  return (
    <section className="bg-navy-900 py-20">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
          Your Dream Job is Waiting.
        </h2>
        <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of candidates who improved their interview confidence for free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
             onClick={() => window.open('https://wa.me/?text=Hi%20NextStep%20Resume,%20I%20am%20interested%20in%20your%20services.', '_blank')}
             className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <i className="fab fa-whatsapp text-2xl mr-3"></i>
            Connect on WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
};

export default BottomCTA;

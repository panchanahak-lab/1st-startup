
import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 md:py-32 bg-white dark:bg-navy-950 relative overflow-hidden transition-colors duration-500">
      {/* Background Orbs */}
      <div className="aura-orb bg-brand-500/10 -top-40 -left-40 scale-75"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="animate-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500 mb-6 block">Our Identity</span>
            <h2 className="text-4xl md:text-6xl font-black text-navy-900 dark:text-white mb-8 tracking-tighter leading-none">
              Engineering the <br />
              <span className="text-gradient">Professional Breakthrough.</span>
            </h2>
            <div className="space-y-6 text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
              <p>
                NextStep Resume isn't just a document service—it's a <strong>Career Intelligence Lab</strong>. We were founded on a single premise: the modern job market is a high-stakes data game, and the traditional resume is no longer enough to win.
              </p>
              <p>
                By merging deep linguistic analysis with Generative AI, we've built a suite that doesn't just "list" your history—it architect's your future. We help the world's most ambitious professionals navigate the "Black Box" of corporate hiring with precision.
              </p>
            </div>
            
            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-3xl font-black text-navy-900 dark:text-white">98%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ATS Bypass Rate</p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
              <div>
                <p className="text-3xl font-black text-navy-900 dark:text-white">15k+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offers Secured</p>
              </div>
            </div>
          </div>

          <div className="animate-reveal [animation-delay:200ms] grid gap-6">
            <div className="glass-premium dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-xl group hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <i className="fas fa-microchip text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-navy-900 dark:text-white mb-2">Neural Matching</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Our algorithms analyze the semantic intent of job descriptions to ensure your CV is parsed with maximum relevance score.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-premium dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-xl group hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0 group-hover:bg-accent-purple group-hover:text-white transition-all">
                  <i className="fas fa-brain text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-navy-900 dark:text-white mb-2">Behavioral Simulations</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Native-audio AI interviewers simulate high-pressure environments, training you to deliver consistent, elite performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-premium dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-xl group hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <i className="fas fa-fingerprint text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-navy-900 dark:text-white mb-2">Kinetic Branding</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    We synchronize your visual and textual presence across LinkedIn and resumes to create an undeniable executive authority.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;

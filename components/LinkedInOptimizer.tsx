import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface OptimizedProfile {
  executiveSummary: string;
  headlines: {
    seo: string;
    value: string;
    executive: string;
  };
  about: string;
  recommendedSkills: string[];
  brandingFeedback: {
    area: string;
    score: number;
    tip: string;
  }[];
  outreachScripts: {
    type: string;
    message: string;
  }[];
}

const LinkedInOptimizer: React.FC = () => {
  const [currentContent, setCurrentContent] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizedProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleOptimize = async () => {
    if (!targetRole) {
      alert("Please specify your target role.");
      return;
    }

    setIsOptimizing(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              executiveSummary: { type: SchemaType.STRING, description: "A high-level 2-3 sentence overview of the analysis and the single most important recommendation." },
              headlines: {
                type: SchemaType.OBJECT,
                properties: {
                  seo: { type: SchemaType.STRING },
                  value: { type: SchemaType.STRING },
                  executive: { type: SchemaType.STRING }
                },
                required: ["seo", "value", "executive"]
              },
              about: { type: SchemaType.STRING },
              recommendedSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              brandingFeedback: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    area: { type: SchemaType.STRING },
                    score: { type: SchemaType.NUMBER },
                    tip: { type: SchemaType.STRING }
                  },
                  required: ["area", "score", "tip"]
                }
              },
              outreachScripts: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    type: { type: SchemaType.STRING, description: "e.g., 'To Recruiter', 'To Peer'" },
                    message: { type: SchemaType.STRING }
                  },
                  required: ["type", "message"]
                }
              }
            },
            required: ["executiveSummary", "headlines", "about", "recommendedSkills", "brandingFeedback", "outreachScripts"]
          }
        }
      });

      const prompt = `Act as a top-tier Executive Career Coach and LinkedIn Branding Expert. 
          Optimize a LinkedIn profile for a professional targeting the role: ${targetRole}.
          Tone Preference: ${tone}.
          Target Job Description (Context): ${jobDescription || 'Not provided'}
          Current Profile Text: ${currentContent || 'Not provided'}
          ${screenshot ? 'I have also attached a screenshot of the current profile. Analyze the visual branding, profile picture placement, banner effectiveness, and layout.' : ''}`;

      const imageParts: any[] = [];
      if (screenshot) {
        const base64 = await fileToBase64(screenshot);
        imageParts.push({
          inlineData: {
            data: base64,
            mimeType: screenshot.type
          }
        });
      }

      const result = await model.generateContent([prompt, ...imageParts]);
      const data = JSON.parse(result.response.text());
      setResult(data);
    } catch (error) {
      console.error("Optimization failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section id="linkedin-optimizer" className="py-24 bg-white dark:bg-navy-950 border-t border-slate-100 dark:border-white/5 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0A66C2]/10 text-[#0A66C2] rounded-3xl mb-6 shadow-sm">
            <i className="fab fa-linkedin text-4xl"></i>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-navy-900 dark:text-white mb-4 tracking-tight">AI LinkedIn Branding Engine</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Our multi-modal AI analyzes your profile visual data and text to transform your personal brand into a recruiter magnet.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
          {/* Input Side */}
          <div className="space-y-6 sticky top-24">
            <div className="bg-slate-50 dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-sm font-bold text-navy-900 dark:text-slate-100 uppercase tracking-widest mb-6 border-b dark:border-white/5 pb-2 flex items-center gap-2">
                <i className="fas fa-sliders-h text-[#0A66C2]"></i> Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Target Career Goal</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Director of Engineering"
                    className="w-full p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[#0A66C2] transition-all text-sm text-navy-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Desired Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[#0A66C2] transition-all text-sm appearance-none text-navy-900 dark:text-white"
                  >
                    <option>Professional</option>
                    <option>Creative & Bold</option>
                    <option>Executive & Minimalist</option>
                    <option>Warm & Friendly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Job Description Match (Optional)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a specific JD for deep alignment..."
                    className="w-full h-24 p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[#0A66C2] transition-all resize-none text-xs text-navy-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Profile Screenshot (Optional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${screenshot ? 'border-[#0A66C2] bg-[#0A66C2]/5' : 'border-slate-300 dark:border-white/10 hover:border-slate-400'}`}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    {screenshotPreview ? (
                      <img src={screenshotPreview} className="h-20 mx-auto rounded-lg shadow-sm object-cover" alt="Preview" />
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500">
                        <i className="fas fa-camera text-xl mb-1"></i>
                        <p className="text-[10px] font-bold uppercase">Upload Screenshot</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                >
                  {isOptimizing ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i>
                      AI Branding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-wand-magic-sparkles group-hover:animate-pulse"></i>
                      Optimize My Brand
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Result Side */}
          <div className="min-h-[600px] flex flex-col">
            {!result ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12 text-slate-400 bg-slate-50/50 dark:bg-navy-900/10 transition-colors">
                <div className="w-24 h-24 bg-white dark:bg-navy-900 rounded-full flex items-center justify-center shadow-sm mb-6 border dark:border-white/5">
                  <i className="fas fa-rocket text-4xl text-brand-300"></i>
                </div>
                <p className="text-xl font-bold text-navy-900 dark:text-white">Ready for Launch?</p>
                <p className="text-sm mt-2 max-w-xs mx-auto dark:text-slate-400">Upload your info and let Gemini Pro architect your executive presence on LinkedIn.</p>
              </div>
            ) : (
              <div className="space-y-10 animate-fade-in pb-20">
                {/* Executive Summary Section */}
                <div className="bg-gradient-to-br from-[#0A66C2]/5 to-brand-500/5 dark:from-[#0A66C2]/10 dark:to-brand-500/10 p-8 rounded-[2.5rem] border border-[#0A66C2]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <i className="fas fa-lightbulb text-6xl text-[#0A66C2]"></i>
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#0A66C2] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#0A66C2] rounded-full"></span>
                    Strategic Executive Summary
                  </h3>
                  <p className="text-lg md:text-xl font-bold text-navy-900 dark:text-white leading-relaxed relative z-10 tracking-tight">
                    {result.executiveSummary}
                  </p>
                </div>

                {/* Branding Score */}
                <div className="bg-navy-900 dark:bg-navy-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border dark:border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32"></div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <i className="fas fa-chart-pie text-brand-400"></i> AI Branding Audit
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {result.brandingFeedback.map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-brand-400">{item.area}</span>
                          <span className="text-lg font-bold">{item.score}%</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic">"{item.tip}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Headlines Section */}
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-3">
                    <i className="fas fa-bullhorn text-[#0A66C2]"></i> Strategic Headlines
                  </h3>
                  <div className="grid gap-4">
                    {[
                      { label: 'SEO Multi-Key', text: result.headlines.seo, desc: 'Optimized for recruiter search algorithms.' },
                      { label: 'The Value Proposition', text: result.headlines.value, desc: 'Focuses on your unique ROI and impact.' },
                      { label: 'The Minimalist Executive', text: result.headlines.executive, desc: 'Clean, punchy, and professional.' }
                    ].map((h, i) => (
                      <div key={i} className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm group hover:border-[#0A66C2] dark:hover:border-[#0A66C2] transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#0A66C2] tracking-tighter">{h.label}</span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{h.desc}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(h.text)}
                            className="text-slate-300 hover:text-[#0A66C2] transition-all hover:scale-110"
                            title="Copy Headline"
                          >
                            <i className="fas fa-copy text-lg"></i>
                          </button>
                        </div>
                        <p className="text-slate-800 dark:text-slate-100 font-bold text-lg leading-snug mt-3 relative z-10">{h.text}</p>
                        <div className="absolute top-0 right-0 w-1 bg-[#0A66C2] h-0 group-hover:h-full transition-all duration-300"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-[#0A66C2]/5 dark:bg-[#0A66C2]/10 p-10 rounded-3xl border border-[#0A66C2]/20 relative">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-3">
                      <i className="fas fa-feather-pointed text-[#0A66C2]"></i> Your New Story
                    </h3>
                    <button
                      onClick={() => copyToClipboard(result.about)}
                      className="bg-[#0A66C2] text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs font-bold"
                    >
                      <i className="fas fa-copy"></i> Copy Summary
                    </button>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200 text-base leading-[1.8] whitespace-pre-wrap font-medium">
                    {result.about}
                  </div>
                  <div className="mt-8 pt-6 border-t border-[#0A66C2]/10 dark:border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Targeted Keywords Integrated</p>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedSkills.slice(0, 8).map((s, i) => (
                        <span key={i} className="text-[10px] font-bold bg-white dark:bg-navy-950 text-[#0A66C2] px-2 py-1 rounded border border-[#0A66C2]/20">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outreach Scripts */}
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-3">
                    <i className="fas fa-paper-plane text-brand-500"></i> AI Networking Scripts
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {result.outreachScripts.map((script, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{script.type}</span>
                          <button onClick={() => copyToClipboard(script.message)} className="text-slate-300 hover:text-navy-900 dark:hover:text-white transition-colors">
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"{script.message}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkedInOptimizer;
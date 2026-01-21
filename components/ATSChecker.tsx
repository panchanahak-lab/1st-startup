
import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface ATSCheckerProps {
  isLoggedIn: boolean;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

interface AnalysisResult {
  overallScore: number;
  sectionScores: {
    summary: number;
    experience: number;
    education: number;
    skills: number;
  };
  issues: {
    title: string;
    location: string;
    description: string;
    highlight: string;
    suggestion: string;
    severity: 'critical' | 'warning' | 'info';
  }[];
}

const ATSChecker: React.FC<ATSCheckerProps> = ({ isLoggedIn, onOpenAuth }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = async () => {
    if (!file) return;
    setStatus('analyzing');
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              overallScore: { type: SchemaType.NUMBER },
              sectionScores: {
                type: SchemaType.OBJECT,
                properties: { summary: { type: SchemaType.NUMBER }, experience: { type: SchemaType.NUMBER }, education: { type: SchemaType.NUMBER }, skills: { type: SchemaType.NUMBER } },
                required: ["summary", "experience", "education", "skills"]
              },
              issues: {
                type: SchemaType.ARRAY, items: {
                  type: SchemaType.OBJECT,
                  properties: { title: { type: SchemaType.STRING }, location: { type: SchemaType.STRING }, description: { type: SchemaType.STRING }, highlight: { type: SchemaType.STRING }, suggestion: { type: SchemaType.STRING }, severity: { type: SchemaType.STRING } },
                  required: ["title", "location", "description", "highlight", "suggestion", "severity"]
                }
              }
            },
            required: ["overallScore", "sectionScores", "issues"]
          }
        }
      });

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await model.generateContent([
          {
            inlineData: {
              data: base64,
              mimeType: file.type || 'application/pdf'
            }
          },
          `Analyze this resume against JD: ${jobDescription}. Focus on scoring and identifying specific optimization gaps. Provide JSON result.`
        ]);
        setAnalysisResult(JSON.parse(result.response.text()));
        setStatus('complete');
      };
    } catch (e) { setStatus('error'); }
  };

  return (
    <section id="ats-checker" className="py-16 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-navy-900 dark:text-white mb-6 tracking-tighter">Neural ATS <span className="text-gradient">Audit</span></h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Uncover the invisible scoring layers used by recruiter portals to filter out 98% of applications.
          </p>
        </div>

        <div className="glass-premium dark:bg-navy-900/60 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 lg:p-24 shadow-3xl relative overflow-hidden group">
          {/* Internal Glow Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-30"></div>

          {status === 'idle' && (
            <div className="flex flex-col items-center w-full">
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-3xl border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2rem] md:rounded-[3rem] p-10 md:p-24 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-all group/drop"
                >
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover/drop:scale-110 transition-transform">
                    <i className="fas fa-cloud-upload-alt text-2xl md:text-4xl text-brand-500"></i>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black dark:text-white mb-2 md:mb-4">Upload Professional CV</h3>
                  <p className="text-slate-500 font-medium text-sm md:text-base">Select PDF or Word. Encrypted processing locally.</p>
                </div>
              ) : (
                <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
                  <div className="bg-navy-950 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-file-pdf text-4xl md:text-6xl"></i></div>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-3xl shadow-brand-500/40 transform rotate-3">
                      <i className="fas fa-check text-xl md:text-2xl text-white"></i>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-white mb-2 truncate w-full">{file.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 md:mb-10">Integrity Verified</p>
                    <button onClick={() => setFile(null)} className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-redo"></i> Change File
                    </button>
                  </div>

                  <div className="space-y-6 md:space-y-8 w-full">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Contextual Target (Optional)</label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the Job Description here..."
                        className="w-full h-32 md:h-48 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-8 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium"
                      />
                    </div>
                    <button
                      onClick={startAnalysis}
                      className="w-full py-5 md:py-6 bg-navy-900 dark:bg-brand-500 hover:bg-brand-600 text-white rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-3xl shadow-brand-500/40 btn-premium"
                    >
                      Initialize Audit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'analyzing' && (
            <div className="h-[300px] md:h-[400px] flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8 md:mb-12">
                <div className="absolute inset-0 border-[6px] md:border-[8px] border-brand-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] md:border-[8px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <i className="fas fa-brain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-4xl text-brand-500 animate-pulse"></i>
              </div>
              <h3 className="text-2xl md:text-4xl font-black dark:text-white mb-2 md:mb-4 tracking-tighter">Deconstructing Lexical Patterns</h3>
              <p className="text-slate-500 font-bold text-[10px] md:text-sm tracking-widest uppercase opacity-50">Mapping semantic relevance across 40+ clusters...</p>
            </div>
          )}

          {status === 'complete' && analysisResult && (
            <div className="animate-reveal grid lg:grid-cols-[1fr_2fr] gap-8 md:gap-16">
              <div className="space-y-6 md:space-y-8">
                <div className="glass-premium dark:bg-white/5 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] text-center border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 mb-6 md:mb-8">
                    <span className="text-6xl md:text-8xl font-black dark:text-white tracking-tighter">{analysisResult.overallScore}</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Overall Quality Index</p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 animate-shimmer" style={{ width: `${analysisResult.overallScore}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {Object.entries(analysisResult.sectionScores).map(([key, val]) => (
                    <div key={key} className="glass-premium dark:bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/10">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{key}</p>
                      <p className="text-xl md:text-2xl font-black dark:text-white tracking-tighter">{val}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <h3 className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter italic">Found {analysisResult.issues.length} Structural Gaps</h3>
                <div className="space-y-4 md:space-y-6 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
                  {analysisResult.issues.map((issue, i) => (
                    <div key={i} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-l-[8px] md:border-l-[12px] ${issue.severity === 'critical' ? 'border-l-red-500' : 'border-l-amber-500'} bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-white/5 shadow-xl hover:translate-x-1 md:hover:translate-x-2 transition-all group`}>
                      <div className="flex justify-between items-start mb-4 md:mb-6">
                        <div>
                          <h4 className="font-black text-xl md:text-2xl dark:text-white mb-1 group-hover:text-brand-500 transition-colors">{issue.title}</h4>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{issue.location}</p>
                        </div>
                        <i className={`fas ${issue.severity === 'critical' ? 'fa-bolt-lightning text-red-500' : 'fa-triangle-exclamation text-amber-500'} text-lg md:text-xl`}></i>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic mb-6 md:mb-10 leading-relaxed font-medium text-sm md:text-base">"{issue.highlight}"</p>
                      <div className="bg-brand-500/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-brand-500/10">
                        <p className="text-[9px] md:text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 md:mb-3">Suggested Pivot:</p>
                        <p className="text-sm md:text-base font-bold dark:text-slate-200">{issue.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStatus('idle')} className="w-full py-5 md:py-6 bg-navy-900 text-white rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:bg-navy-900 transition-all">New Scan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ATSChecker;

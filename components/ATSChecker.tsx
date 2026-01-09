
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface ATSCheckerProps {
  isLoggedIn: boolean;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

// Define the structure of the analysis result
interface AnalysisResult {
  overallScore: number;
  matchScore?: number; // Feature 1: JD Match
  sectionScores: {
    summary: number;
    experience: number;
    education: number;
    skills: number;
  };
  formattingScore: number;
  keywordScore: number;
  detectedKeywords: string[];
  missingKeywords: string[];
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up the object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    
    // Check by MIME type or extension (as fallback)
    const isTypeValid = validTypes.includes(selectedFile.type);
    const isExtensionValid = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (isTypeValid || isExtensionValid) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setAnalysisResult(null);
    } else {
      alert("Please upload a PDF or Word document (.doc, .docx).");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStatus('analyzing');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = await fileToBase64(file);

      // robust mime type detection
      let mimeType = file.type;
      const name = file.name.toLowerCase();
      if (!mimeType) {
        if (name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (name.endsWith('.doc')) mimeType = 'application/msword';
      }

      const hasJD = jobDescription.trim().length > 0;
      
      const promptText = hasJD 
        ? `Analyze this resume against the provided Job Description. Calculate a Match Score based on semantic similarity and keyword presence. Also perform detailed scoring by section.` 
        : `Please analyze this resume for ATS compatibility. Provide overall scores and detailed breakdowns for Experience, Education, Summary, and Skills sections.`;

      const parts = [
        {
          inlineData: {
            mimeType: mimeType || 'application/pdf',
            data: base64Data
          }
        },
        { text: promptText }
      ];

      if (hasJD) {
        parts.push({ text: `JOB DESCRIPTION:\n${jobDescription}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER, description: "Overall ATS/Quality score from 0-100" },
              matchScore: { type: Type.NUMBER, description: "Similarity score vs Job Description (0-100). Return 0 if no JD provided." },
              sectionScores: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.NUMBER, description: "Quality score for the summary section (0-100)" },
                  experience: { type: Type.NUMBER, description: "Quality score for the experience section (0-100)" },
                  education: { type: Type.NUMBER, description: "Quality score for the education section (0-100)" },
                  skills: { type: Type.NUMBER, description: "Quality score for the skills section (0-100)" },
                },
                required: ["summary", "experience", "education", "skills"],
              },
              formattingScore: { type: Type.NUMBER, description: "Formatting score from 0-100" },
              keywordScore: { type: Type.NUMBER, description: "Keyword optimization score from 0-100" },
              detectedKeywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of professional skills/keywords found"
              },
              missingKeywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of missing high-value keywords (if JD provided, prioritize missing JD keywords)"
              },
              issues: {
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    location: { type: Type.STRING },
                    description: { type: Type.STRING },
                    highlight: { type: Type.STRING, description: "The specific text snippet with the issue" },
                    suggestion: { type: Type.STRING },
                    severity: { type: Type.STRING, description: "One of: critical, warning, info" }
                  },
                  required: ["title", "location", "description", "highlight", "suggestion", "severity"],
                }
              }
            },
            required: ["overallScore", "sectionScores", "formattingScore", "keywordScore", "detectedKeywords", "missingKeywords", "issues"],
          },
          systemInstruction: `You are an expert ATS optimization specialist. 
          Parse the resume. If a Job Description is present, perform a deep semantic match (like Cosine Similarity) to determine the 'matchScore' and identify 'missingKeywords' strictly relevant to the JD.
          Analyze individual sections (Summary, Experience, Education, Skills) and provide specific quality scores (0-100) for each based on content impact, quantification of achievements, clarity, and ATS parsing friendliness.`
        }
      });

      const resultText = response.text;
      if (resultText) {
        const resultJson = JSON.parse(resultText) as AnalysisResult;
        setAnalysisResult(resultJson);
        setStatus('complete');
      } else {
        throw new Error("Empty response from model");
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-orange-100 text-orange-900 border-b border-orange-200 px-1 mx-0.5 rounded-sm font-medium break-words">
      {children}
    </span>
  );

  const SuggestionBox: React.FC<{ content: string; italic?: boolean }> = ({ content, italic }) => {
    if (!isLoggedIn) {
      return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative overflow-hidden mt-3 group">
          <div className="filter blur-sm select-none opacity-40 transition-opacity duration-300">
             <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Suggestion:</p>
             <p className="text-slate-800 text-sm">
               Login to view the detailed fix for this issue. We provide tailored suggestions to improve your ATS score.
             </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/10">
            <button 
                onClick={() => onOpenAuth('signup')}
                className="bg-navy-900 hover:bg-brand-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
            >
                <i className="fas fa-lock text-[10px]"></i> Unlock Suggestion
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3 animate-fade-in">
         <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Suggestion:</p>
         <p className={`text-slate-800 text-sm ${italic ? 'italic' : ''}`}>{content}</p>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'yellow';
      default: return 'brand';
    }
  };

  const isPdf = file ? (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) : false;

  return (
    <section id="ats-checker" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 animate-fade-in-up">
          <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 inline-block">
            <i className="fas fa-magic mr-1"></i> Free Tool
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            Is Your Resume ATS-Proof?
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            See exactly what recruiters see. Upload your resume to uncover grammatical errors, formatting issues, and keyword gaps.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col">
          <div className="bg-navy-900 p-6 text-white flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <span className="font-heading font-bold text-lg tracking-wide hidden sm:inline">Scanner<span className="text-brand-400">Pro</span></span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <div className={`w-2 h-2 rounded-full ${status === 'analyzing' ? 'bg-yellow-400 animate-ping' : status === 'complete' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
              <span>
                {status === 'analyzing' ? 'Processing...' : 
                 status === 'complete' ? 'Done' : 
                 status === 'error' ? 'Error' : 'Online'}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 bg-slate-50/50">
            {status === 'idle' && (
              <div className="h-full flex flex-col justify-center">
                <div 
                  className={`flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${
                    file ? 'bg-white' : 'border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-slate-50 p-6 md:p-10 bg-white'
                  }`}
                  onDragOver={(e) => !file && e.preventDefault()}
                  onDrop={(e) => {
                    if (file) return;
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      validateAndSetFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div className="flex flex-col md:flex-row gap-8 w-full items-start animate-fade-in">
                       {/* Preview Panel */}
                       <div className="w-full md:w-1/2 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden h-64 md:h-[500px] shadow-inner relative flex items-center justify-center">
                          {isPdf && previewUrl ? (
                             <iframe 
                               src={previewUrl} 
                               className="w-full h-full" 
                               title="Resume Preview"
                             ></iframe>
                          ) : (
                             <div className="flex flex-col items-center text-slate-400">
                                <i className="fas fa-file-word text-6xl text-brand-600 mb-4 opacity-80"></i>
                                <p className="font-medium text-navy-900">Word Document Selected</p>
                                <p className="text-sm mt-1">Preview not available for Word files.</p>
                             </div>
                          )}
                       </div>

                       {/* Action Panel */}
                       <div className="w-full md:w-1/2 flex flex-col justify-center h-full py-4">
                          <div className="bg-brand-50 rounded-xl p-6 mb-6 border border-brand-100">
                             <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-brand-500">
                                   {isPdf ? <i className="fas fa-file-pdf text-2xl"></i> : <i className="fas fa-file-word text-2xl"></i>}
                                </div>
                                <div className="overflow-hidden">
                                   <p className="font-heading font-bold text-navy-900 truncate" title={file.name}>{file.name}</p>
                                   <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                             </div>
                          </div>

                          {/* Feature 1: JD Input */}
                          <div className="mb-6">
                            <label className="block text-sm font-bold text-navy-900 mb-2">
                              Job Description (Optional)
                              <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Recommended</span>
                            </label>
                            <textarea
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              placeholder="Paste the job description here to get a Match Score..."
                              className="w-full h-32 p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                            ></textarea>
                          </div>
                          
                          <button 
                            onClick={startAnalysis}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 mb-4 text-lg"
                          >
                            <i className="fas fa-search-location mr-2"></i> {jobDescription.trim() ? 'Scan & Compare' : 'Scan Resume'}
                          </button>
                          
                          <button 
                            onClick={reset}
                            className="w-full py-3 text-slate-500 hover:text-red-500 font-medium transition-colors border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg flex items-center justify-center"
                          >
                            <i className="fas fa-trash-alt mr-2"></i> Remove File
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div 
                      className="flex flex-col items-center cursor-pointer py-8 text-center w-full" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6 group-hover:text-brand-500 group-hover:bg-brand-100 transition-colors">
                        <i className="fas fa-cloud-upload-alt text-3xl"></i>
                      </div>
                      <h3 className="text-xl font-bold text-navy-900 mb-2">Upload your resume</h3>
                      <p className="text-slate-500 mb-6 max-w-xs mx-auto">Tap to upload or drag and drop your PDF/Word file here to get a detailed ATS analysis.</p>
                      <button className="bg-white border border-slate-300 text-navy-900 hover:bg-slate-50 font-semibold py-2 px-6 rounded-lg shadow-sm transition-all pointer-events-none">
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status === 'analyzing' && (
              <div className="h-full flex flex-col items-center justify-center py-10 animate-fade-in">
                <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                   <i className="fas fa-microscope absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-brand-500 text-2xl animate-pulse"></i>
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-2">Analyzing Resume...</h3>
                <div className="text-slate-500 text-sm flex flex-col items-center space-y-2 w-64">
                   <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-500 h-1.5 rounded-full animate-progress"></div>
                   </div>
                   <p className="animate-pulse text-xs">Gemini is checking keywords...</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="h-full flex flex-col items-center justify-center py-10 animate-fade-in text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                  <i className="fas fa-exclamation-triangle text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Analysis Failed</h3>
                <p className="text-slate-600 mb-6">Something went wrong while processing your resume. Please try again.</p>
                <button onClick={reset} className="text-brand-500 hover:text-navy-900 font-medium py-2 px-6 border border-brand-500 rounded-lg hover:bg-brand-50 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {status === 'complete' && analysisResult && (
              <div className="animate-fade-in-up flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 flex flex-col gap-6">
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm text-center">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6">
                      {analysisResult.matchScore ? 'JD Match Score' : 'Overall ATS Score'}
                    </h3>
                    <div className="relative inline-block mx-auto mb-6">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                        <circle 
                          cx="80" cy="80" r="70" 
                          stroke="currentColor" 
                          className={getScoreColor(analysisResult.matchScore || analysisResult.overallScore)}
                          strokeWidth="12" fill="none" 
                          strokeDasharray="439.8" 
                          strokeDashoffset={439.8 - (439.8 * (analysisResult.matchScore || analysisResult.overallScore) / 100)} 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="block text-5xl font-bold text-navy-900 tracking-tight">{analysisResult.matchScore || analysisResult.overallScore}</span>
                        <span className="text-sm text-slate-500 font-medium">/ 100</span>
                      </div>
                    </div>
                    
                    {/* Granular Section Scores */}
                    <div className="mb-6 space-y-3 text-left">
                       <p className="text-xs font-bold text-navy-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Section Analysis</p>
                       {[
                         { label: 'Experience', score: analysisResult.sectionScores.experience },
                         { label: 'Education', score: analysisResult.sectionScores.education },
                         { label: 'Summary', score: analysisResult.sectionScores.summary },
                         { label: 'Skills', score: analysisResult.sectionScores.skills }
                       ].map((item) => (
                         <div key={item.label}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600">{item.label}</span>
                                <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                   className={`h-1.5 rounded-full transition-all duration-1000 ${getScoreBg(item.score)}`} 
                                   style={{ width: `${item.score}%` }}
                                ></div>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Formatting</div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.formattingScore)}`}>
                          {analysisResult.formattingScore}<span className="text-xs text-slate-400 ml-0.5">/100</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Keywords</div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.keywordScore)}`}>
                          {analysisResult.keywordScore}<span className="text-xs text-slate-400 ml-0.5">/100</span>
                        </div>
                      </div>
                    </div>
                    
                    <a href="#pricing" className="block w-full bg-navy-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm mb-3">
                      Fix All Errors Now
                    </a>
                    <button onClick={reset} className="text-slate-500 hover:text-navy-900 text-sm font-medium">
                      <i className="fas fa-redo mr-1"></i> Scan Another Resume
                    </button>
                  </div>
                </div>
                
                <div className="lg:w-2/3">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="font-heading text-xl font-bold text-navy-900">Analysis Report</h3>
                       <p className="text-xs text-slate-500 mt-1">Generated by Gemini 3 Pro</p>
                     </div>
                     <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                       {analysisResult.issues.length} Issues Found
                     </span>
                   </div>

                   <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                     <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                       <h4 className="font-bold text-navy-900 text-sm uppercase tracking-wide mb-3 flex items-center">
                         <i className="fas fa-tags text-brand-500 mr-2"></i> Keyword Analysis
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <p className="text-xs text-slate-500 font-semibold mb-2">DETECTED</p>
                           <div className="flex flex-wrap gap-2">
                             {analysisResult.detectedKeywords.map((w, i) => (
                               <span key={i} className="bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded text-xs font-semibold">
                                 <i className="fas fa-check text-[10px] mr-1"></i>{w}
                               </span>
                             ))}
                             {analysisResult.detectedKeywords.length === 0 && <span className="text-xs text-slate-400">No keywords detected.</span>}
                           </div>
                         </div>
                         <div>
                           <p className="text-xs text-slate-500 font-semibold mb-2">MISSING</p>
                           <div className="flex flex-wrap gap-2">
                             {analysisResult.missingKeywords.map((w, i) => (
                               <span key={i} className="bg-red-50 text-red-500 border border-red-100 px-2 py-1 rounded text-xs font-semibold opacity-75">
                                 <i className="fas fa-times text-[10px] mr-1"></i>{w}
                               </span>
                             ))}
                              {analysisResult.missingKeywords.length === 0 && <span className="text-xs text-slate-400">Great job! No major keywords missing.</span>}
                           </div>
                         </div>
                       </div>
                     </div>

                     {analysisResult.issues.map((issue, index) => {
                       const severityColor = getSeverityColor(issue.severity);
                       const borderColor = severityColor === 'red' ? 'border-l-red-500' : severityColor === 'orange' ? 'border-l-orange-500' : 'border-l-yellow-500';
                       const textColor = severityColor === 'red' ? 'text-red-600' : severityColor === 'orange' ? 'text-orange-600' : 'text-yellow-600';
                       
                       return (
                        <div key={index} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${borderColor}`}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`font-bold ${textColor} text-sm uppercase tracking-wide`}>{issue.title}</h4>
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2"><i className="fas fa-clock mr-1"></i> {issue.location}</span>
                          </div>
                          <div className="text-slate-700 leading-relaxed mb-3 text-sm">
                            <p className="mb-2">{issue.description}</p>
                            <p className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                              <span className="font-semibold mr-1">Found:</span> 
                              <Highlight>{issue.highlight}</Highlight>
                            </p>
                          </div>
                          <SuggestionBox 
                            content={issue.suggestion}
                          />
                        </div>
                       );
                     })}
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

export default ATSChecker;


import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Type, Modality } from "@google/genai";

// --- ENCODING & DECODING HELPERS ---

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface TranscriptItem {
  role: 'user' | 'ai';
  text: string;
}

interface InterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Kannada', 'Spanish', 'French', 'German'];

type SessionStage = 'setup' | 'initializing' | 'interview' | 'processing_feedback' | 'feedback';

const LiveInterview: React.FC = () => {
  const [stage, setStage] = useState<SessionStage>('setup');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState<string>('');
  const [language, setLanguage] = useState('English');
  const [isConnected, setIsConnected] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  const cleanupAudio = () => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteFrequencyData(dataArray);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / (bufferLength / 2));
      let x = 0;
      for (let i = 0; i < bufferLength / 2; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    draw();
  };

  const startInterviewFlow = async () => {
    if (!resumeFile || !jobRole) {
      alert("Please upload a resume and specify the job role.");
      return;
    }
    
    setStage('initializing');
    setIsError(false);
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputCtx.resume();
      await outputCtx.resume();
      
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const analyser = inputCtx.createAnalyser();
      analyserRef.current = analyser;
      drawVisualizer();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a professional, high-pressure interviewer for the position of ${jobRole}. Conduct the interview in ${language}. Ask one question at a time. Be critical but fair. Initial greeting should acknowledge the candidate's resume for ${jobRole}.`,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setStage('interview');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcm = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcm }));
            };
            source.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            sessionPromise.then(s => sessionRef.current = s);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              return;
            }

            if (msg.serverContent?.inputTranscription) currentInputTransRef.current += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription) currentOutputTransRef.current += msg.serverContent.outputTranscription.text;
            
            if (msg.serverContent?.turnComplete) {
              setTranscripts(p => [...p, 
                { role: 'user', text: currentInputTransRef.current }, 
                { role: 'ai', text: currentOutputTransRef.current }
              ]);
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await pcmToAudioBuffer(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => { 
            console.error(e);
            cleanupAudio(); 
            setStage('setup'); 
            setIsError(true); 
            setErrorMessage("An error occurred during the session."); 
          },
          onclose: () => {
            setIsConnected(false);
          }
        }
      });
    } catch (err: any) {
      console.error(err);
      setStage('setup');
      setIsError(true);
      setErrorMessage(err.name === 'NotAllowedError' ? "Microphone access denied. Please check your browser settings." : "Failed to initialize the interview. Please try again.");
    }
  };

  const stopAndFeedback = async () => {
    if (sessionRef.current) sessionRef.current.close();
    cleanupAudio();
    setIsConnected(false);
    setStage('processing_feedback');
    
    const history = transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the following interview for a ${jobRole} position. Provide a score out of 100, a summary, strengths, weaknesses, and specific suggestions for improvement. Return purely JSON.\n\nINTERVIEW LOG:\n${history}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { 
              score: { type: Type.NUMBER }, 
              summary: { type: Type.STRING }, 
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, 
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, 
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } 
            },
            required: ["score", "summary", "strengths", "weaknesses", "suggestions"]
          }
        }
      });
      setFeedback(JSON.parse(res.text || '{}'));
      setStage('feedback');
    } catch { 
      setStage('setup'); 
      alert("Feedback generation failed."); 
    }
  };

  const handleDownloadReport = () => {
    // Trigger the print dialog. Our print styles in index.html will ensure only the feedback is printed.
    window.print();
  };

  return (
    <section id="interview" className="py-20 bg-navy-900 min-h-[800px] text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,100,158,0.1),transparent)] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12 print:hidden">
          <h2 className="text-4xl font-bold mb-4 font-heading tracking-tight">AI Interview Coach</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Experience a high-pressure interview with our native AI agent. Practice, get scored, and improve instantly.</p>
        </div>

        <div className={`bg-slate-800/40 rounded-3xl border border-slate-700/50 backdrop-blur-md p-6 md:p-10 shadow-2xl ${stage === 'feedback' ? 'printable-content' : ''}`}>
          {stage === 'setup' && (
            <div className="max-w-md mx-auto space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Target Job Role</label>
                  <input 
                    value={jobRole} 
                    onChange={e => setJobRole(e.target.value)} 
                    className="w-full bg-navy-900/50 border border-slate-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                    placeholder="e.g. Project Manager" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Interview Language</label>
                  <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)} 
                    className="w-full bg-navy-900/50 border border-slate-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
                  >
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Upload Resume (PDF/Word)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${resumeFile ? 'border-brand-500 bg-brand-500/5' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/30'}`}
                  >
                     <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => e.target.files && setResumeFile(e.target.files[0])} />
                     <i className={`fas ${resumeFile ? 'fa-file-check text-brand-400' : 'fa-cloud-upload-alt text-slate-500'} text-3xl mb-3`}></i>
                     <p className="text-sm font-medium">{resumeFile ? resumeFile.name : "Tap to browse files"}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={startInterviewFlow} 
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-1"
              >
                Start AI Interview
              </button>
              
              {isError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {stage === 'initializing' && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-brand-500/20 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-brand-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
               </div>
               <p className="text-brand-400 font-medium animate-pulse">Initializing native AI agent...</p>
            </div>
          )}

          {stage === 'interview' && (
            <div className="grid lg:grid-cols-[1fr_350px] gap-8 animate-fade-in">
              <div className="flex flex-col">
                <div className="relative mb-6">
                  <canvas ref={canvasRef} width={600} height={250} className="w-full h-48 bg-navy-900 rounded-2xl border border-slate-700/50 shadow-inner" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">Live Session</span>
                  </div>
                </div>

                <div className="bg-navy-900/50 p-6 rounded-2xl border border-slate-700/50 flex-grow min-h-[150px] flex flex-col justify-center text-center">
                  <p className="text-xs font-bold text-brand-400 mb-3 uppercase tracking-widest">Sarah (AI) Interviewer</p>
                  <p className="text-xl font-medium leading-relaxed italic text-slate-200">
                    {transcripts[transcripts.length - 1]?.role === 'ai' ? `"${transcripts[transcripts.length - 1].text}"` : "Listening to you..."}
                  </p>
                </div>

                <button onClick={stopAndFeedback} className="w-full py-5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl font-bold mt-6 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-stop-circle"></i> End Session & Get Feedback
                </button>
              </div>

              <div className="bg-navy-900/80 p-4 rounded-2xl border border-slate-700/50 flex flex-col h-[500px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-700/50">Transcript</h3>
                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {transcripts.map((t, i) => (
                    <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t.role === 'user' ? 'You' : 'Sarah'}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[90%] ${t.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                  {transcripts.length === 0 && <p className="text-center text-slate-600 text-xs mt-20">Transcript will appear as you talk.</p>}
                </div>
              </div>
            </div>
          )}

          {stage === 'processing_feedback' && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
               <i className="fas fa-brain text-5xl text-brand-500 animate-bounce"></i>
               <p className="text-brand-400 font-medium">Analyzing your performance...</p>
            </div>
          )}

          {stage === 'feedback' && feedback && (
             <div className="animate-fade-in-up space-y-8 print:text-black">
               <div className="text-center">
                 <div className="inline-flex flex-col items-center">
                    <span className="text-7xl font-bold text-brand-500">{feedback.score}</span>
                    <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mt-2">Overall Quality Score</span>
                 </div>
                 <h2 className="text-2xl font-bold mt-4 print:block hidden">Interview Feedback: {jobRole}</h2>
                 <p className="text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed print:text-black">{feedback.summary}</p>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                 <div className="bg-green-500/5 p-6 rounded-3xl border border-green-500/20 print:bg-white print:border-green-200">
                   <h4 className="text-green-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-green-700">
                     <i className="fas fa-check-circle"></i> Key Strengths
                   </h4>
                   <ul className="text-sm space-y-3">
                     {feedback.strengths.map((s,i) => <li key={i} className="flex gap-3 text-slate-300 print:text-black"><span className="text-green-500">•</span> {s}</li>)}
                   </ul>
                 </div>
                 <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/20 print:bg-white print:border-red-200">
                   <h4 className="text-red-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-red-700">
                     <i className="fas fa-exclamation-circle"></i> Weaknesses
                   </h4>
                   <ul className="text-sm space-y-3">
                     {feedback.weaknesses.map((w,i) => <li key={i} className="flex gap-3 text-slate-300 print:text-black"><span className="text-red-500">•</span> {w}</li>)}
                   </ul>
                 </div>
               </div>

               <div className="bg-brand-500/5 p-8 rounded-3xl border border-brand-500/20 print:bg-white print:border-brand-200">
                 <h4 className="text-brand-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-brand-700">
                    <i className="fas fa-lightbulb"></i> Recommendations
                 </h4>
                 <div className="grid sm:grid-cols-2 gap-4">
                    {feedback.suggestions.map((s, i) => (
                      <div key={i} className="bg-navy-900/50 p-4 rounded-xl text-sm text-slate-300 border border-slate-700/50 print:bg-slate-50 print:text-black print:border-slate-200">
                        {s}
                      </div>
                    ))}
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 print:hidden">
                 <button onClick={() => { setStage('setup'); setTranscripts([]); }} className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold transition-all">Start New Session</button>
                 <button onClick={handleDownloadReport} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all">Download Report (PDF)</button>
               </div>
             </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveInterview;

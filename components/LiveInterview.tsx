
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useAuth } from '../lib/AuthContext';

// ... (existing imports)

const LiveInterview: React.FC = () => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [stage, setStage] = useState<SessionStage>('setup');


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

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
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
    idealResponseTip: string;
  }

  const LANGUAGES = [
    'English',
    'Hindi',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Urdu',
    'Gujarati',
    'Kannada',
    'Malayalam',
    'Odia',
    'Punjabi',
    'Assamese',
    'Maithili',
    'Santali',
    'Kashmiri',
    'Nepali',
    'Konkani',
    'Sindhi',
    'Dogri',
    'Manipuri',
    'Bodo',
    'Sanskrit',
    'Bhojpuri',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Mandarin'
  ];

  const LANGUAGE_CODES: Record<string, string> = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Bengali': 'bn-IN',
    'Telugu': 'te-IN',
    'Marathi': 'mr-IN',
    'Tamil': 'ta-IN',
    'Urdu': 'ur-IN',
    'Gujarati': 'gu-IN',
    'Kannada': 'kn-IN',
    'Malayalam': 'ml-IN',
    'Odia': 'or-IN',
    'Punjabi': 'pa-IN',
    'Assamese': 'as-IN',
    'Maithili': 'mai-IN',
    'Santali': 'sat-IN',
    'Kashmiri': 'ks-IN',
    'Nepali': 'ne-NP',
    'Konkani': 'kok-IN',
    'Sindhi': 'sd-IN',
    'Dogri': 'doi-IN',
    'Manipuri': 'mni-IN',
    'Bodo': 'brx-IN',
    'Sanskrit': 'sa-IN',
    'Bhojpuri': 'bho-IN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Japanese': 'ja-JP',
    'Mandarin': 'zh-CN'
  };

  const PERSONAS = {
    mentor: {
      name: 'Supportive Mentor',
      icon: 'fa-hand-holding-heart',
      level: 'Beginner',
      color: 'emerald',
      instruction: 'be encouraging, focus on potential, and offer gentle guidance. Perfect for freshers.'
    },
    recruiter: {
      name: 'Professional Recruiter',
      icon: 'fa-user-tie',
      level: 'Standard',
      color: 'blue',
      instruction: 'be objective, ask standard industry questions, and focus on culture fit. Simulates HR rounds.'
    },
    stress: {
      name: 'High-Pressure Executive',
      icon: 'fa-bolt',
      level: 'Advanced',
      color: 'red',
      instruction: 'be aggressive, challenge their numbers, press for specific metrics, and act skeptical. For senior roles.'
    }
  };

  type SessionStage = 'setup' | 'parsing' | 'initializing' | 'interview' | 'processing_feedback' | 'feedback';

  interface ErrorDetail {
    type: 'MIC_PERMISSION' | 'NETWORK' | 'AI_SYNC' | 'PARSING' | 'GENERIC';
    message: string;
    action?: () => void;
  }

  const LiveInterview: React.FC = () => {
    const [stage, setStage] = useState<SessionStage>('setup');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeContext, setResumeContext] = useState<string>('');
    const [jobRole, setJobRole] = useState<string>('');
    const [language, setLanguage] = useState('English');
    const [persona, setPersona] = useState<keyof typeof PERSONAS>('recruiter');
    const [isConnected, setIsConnected] = useState(false);
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
    const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null);
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [debugMsg, setDebugMsg] = useState<string>('');
    const [voiceWarning, setVoiceWarning] = useState<string | null>(null);

    const [liveUserText, setLiveUserText] = useState('');
    const [liveAiText, setLiveAiText] = useState('');

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
      sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
      sourcesRef.current.clear();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      nextStartTimeRef.current = 0;
      setIsConnected(false);
    };

    const parseResume = async (file: File) => {
      setStage('parsing');
      setErrorDetail(null);
      try {
        // const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); // REMOVED
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
              throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in your environment variables.");
            }
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent([
              {
                inlineData: {
                  data: base64,
                  mimeType: file.type || 'application/pdf'
                }
              },
              "Extract the core experience, top 5 technical skills, and 3 key achievements from this resume. Keep it brief and bulleted."
            ]);
            setResumeContext(result.response.text());
            setResumeFile(file);
            setStage('setup');
          } catch (err: any) {
            console.error("Resume parsing error:", err);
            setErrorDetail({
              type: 'PARSING',
              message: err.message?.includes("API Key") ? "API Key missing. Please configure your environment." : "Neural parsing failed. Please ensure the file is a valid PDF.",
              action: () => setStage('setup')
            });
            setResumeFile(file);
            setStage('setup');
          }
        };

        reader.onerror = () => {
          setErrorDetail({ type: 'PARSING', message: "File reading error. Please try a different PDF or Word document." });
          setStage('setup');
        };

        reader.readAsDataURL(file);
      } catch (e) {
        console.error("Resume parsing failed", e);
        setStage('setup');
      }
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

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }

        const barWidth = (canvas.width / (bufferLength / 1.5));
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
          const color = liveAiText ? '#38bdf8' : '#0ea5e9';

          ctx.fillStyle = color;
          ctx.globalAlpha = 0.2 + (barHeight / canvas.height);

          const y = (canvas.height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 4, barHeight, 20);
          ctx.fill();

          x += barWidth;
        }
      };
      draw();
    };

    const startInterviewFlow = async () => {
      if (!jobRole) {
        alert("Please specify the job role.");
        return;
      }

      if (user?.id) {
        try {
          const res = await fetch('/api/check-interview-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });

          if (res.status === 402) {
            setShowUpgradeModal(true);
            return;
          }
        } catch (e) {
          console.error("Access check failed", e);
        }
      }

      setStage('initializing');
      setErrorDetail(null);
      setTranscripts([]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw { type: 'MIC_PERMISSION', message: "Microphone access denied. Please allow microphone access in your browser settings and try again." };
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            throw { type: 'MIC_PERMISSION', message: "No microphone detected. Please connect a recording device to continue." };
          }
          throw { type: 'MIC_PERMISSION', message: "Hardware error: Unable to access microphone." };
        });

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
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chatSession = model.startChat({
          history: [
            {
              role: "user",
              parts: [{
                text: `You are an expert interviewer in ${language} for the role of ${jobRole}.
            Your persona: ${PERSONAS[persona].instruction}
            
            CANDIDATE CONTEXT (From Resume):
            ${resumeContext || 'No resume provided. Ask about their background first.'}
            
            MANDATORY INSTRUCTIONS:
            1. Speak ONLY in ${language}.
            2. ACT LIKE A HUMAN: Use natural conversational fillers (e.g., "I see", "That's interesting", "Hmm").
            3. TONE: Warm, encouraging, and casual. Do NOT be formal. 
            4. FORMATTING: Do NOT use markdown, bullet points, or numbered lists. Speak in full, flowing sentences.
            5. KEEP IT BRIEF: Ask only one question at a time. Maximum 2 sentences.
            4. LISTEN & REACT: Briefly acknowledge their previous answer before moving on.
            5. Drill down into specific resume details (${resumeContext ? 'Context available' : 'No resume'}).
            6. Start immediately with a warm, human greeting and your first question.
            
            CRITICAL: Do not speak English unless the candidate speaks English. Your output must be in ${language} script and language.`
              }]
            }
          ]
        });

        sessionRef.current = chatSession;
        setIsConnected(true);
        setStage('interview');
        drawVisualizer();

        const startResult = await chatSession.sendMessage(`Start the interview now in ${language}.`);
        const text = startResult.response.text();
        setLiveAiText(text);
        setTranscripts(prev => [...prev, { role: 'ai', text }]);
        speakText(text);

      } catch (err: any) {
        console.error(err);
        cleanupAudio();
        setStage('setup');
        setErrorDetail({
          type: err.type || 'GENERIC',
          message: err.message || "An unexpected error occurred while initializing the session.",
          action: startInterviewFlow
        });
      }
    };

    const speakText = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const targetLangCode = LANGUAGE_CODES[language] || 'en-US';
      utterance.lang = targetLangCode;
      utterance.rate = 0.9; // Slightly slower for more natural pacing
      utterance.pitch = 1.1; // Slightly higher/clearer

      // Robust Voice Selection using state
      let voice = voices.find(v => v.lang === targetLangCode);
      if (!voice) voice = voices.find(v => v.lang.startsWith(targetLangCode.split('-')[0]));
      if (!voice) voice = voices.find(v => v.name.includes(language));

      // Fallback/Debug
      if (voice) {
        utterance.voice = voice;
        setSelectedVoice(voice);
        setVoiceWarning(null);
        setDebugMsg(`Playing with: ${voice.name} (${voice.lang})`);
      } else {
        // 4. Fallback Strategy: Rely on browser's native handling but force 'hi-IN' for Indic info
        // The user confirmed Hindi works "perfectly" even though our debugger saw 0 Hindi voices. 
        // This means Chrome has a "hidden" Network Hindi voice that triggers only on lang='hi-IN'.
        const INDIC_LANGS = ['bn-IN', 'te-IN', 'mr-IN', 'ta-IN', 'ur-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'or-IN', 'pa-IN', 'as-IN', 'mai-IN', 'sat-IN', 'ks-IN', 'ne-NP', 'kok-IN', 'sd-IN', 'doi-IN', 'mni-IN', 'brx-IN', 'sa-IN', 'bho-IN'];

        if (INDIC_LANGS.includes(targetLangCode)) {
          // Force the browser to use its internal Hindi voice
          utterance.lang = 'hi-IN';
          setDebugMsg(`Fallback: Forcing lang='hi-IN' (Browser native magic)`);
          // Do NOT set utterance.voice, let browser find the hidden one.
        } else {
          setDebugMsg(`No voice found for ${targetLangCode}. Using system default.`);
          setVoiceWarning(language);
        }
      }

      utterance.onend = () => startListening();
      utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        // If TTS fails (e.g. language not supported), we still want to continue the interview flow.
        startListening();
      };
      window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
      if (!('webkitSpeechRecognition' in window)) {
        alert("Your browser does not support speech recognition. Please use Chrome.");
        return;
      }
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_CODES[language] || 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setLiveUserText(event.results[i][0].transcript);
            handleUserResponse(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
            setLiveUserText(interimTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Handle no speech or error
      };

      recognition.start();
    };

    const handleUserResponse = async (userText: string) => {
      setTranscripts(prev => [...prev, { role: 'user', text: userText }]);
      setLiveUserText(userText);
      setLiveAiText("Interviewer is thinking...");

      try {
        if (!sessionRef.current) return;
        const result = await sessionRef.current.sendMessage(userText);
        const responseText = result.response.text();

        setLiveAiText(responseText);
        setTranscripts(prev => [...prev, { role: 'ai', text: responseText }]);
        speakText(responseText);
      } catch (error) {
        console.error("Gemini Error:", error);
        setLiveAiText("Error getting response.");
      }
    };

    const stopAndFeedback = async () => {
      if (sessionRef.current) try { sessionRef.current.close(); } catch (e) { }
      cleanupAudio();
      setStage('processing_feedback');
      setErrorDetail(null);

      if (transcripts.length < 2) {
        setErrorDetail({ type: 'GENERIC', message: "Not enough conversation data to generate a meaningful analysis. Please engage in at least 2 turns." });
        setStage('setup');
        return;
      }

      const history = transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
      try {
        // const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); // REMOVED
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("API Key is missing.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                score: { type: SchemaType.NUMBER }, summary: { type: SchemaType.STRING },
                strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                idealResponseTip: { type: SchemaType.STRING }
              },
              required: ["score", "summary", "strengths", "weaknesses", "suggestions", "idealResponseTip"]
            }
          }
        });

        const res = await model.generateContent(`Evaluate this interview for a ${jobRole} role in ${language} with a ${persona} interviewer.
 
 TRANSCRIPT:
 ${history}`);

        setFeedback(JSON.parse(res.response.text()));
        setStage('feedback');
      } catch (err: any) {
        console.error("Feedback generation error:", err);
        setErrorDetail({ type: 'GENERIC', message: err.message?.includes("API Key") ? "API Key missing." : "Neural diagnostic failed. Our analysis servers are currently overwhelmed." });
        setStage('setup');
      }
    };

    return (
      <section id="interview" className="py-24 bg-navy-950 min-h-[900px] text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-3 bg-brand-500/10 text-brand-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-brand-500/20 shadow-lg shadow-brand-500/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Real-Time AI Simulation
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter leading-tight">Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500">Next Interview</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Select your language, role, and difficulty. Our AI Recruiter will grill you just like the real thing.</p>
          </div>

          <div className={`glass dark:bg-navy-900/40 rounded-[3rem] border border-white/5 backdrop-blur-2xl p-8 md:p-16 shadow-2xl transition-all duration-700 relative overflow-hidden ${stage === 'feedback' ? 'bg-white !text-navy-950' : ''}`}>

            {errorDetail && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 animate-reveal flex flex-col md:flex-row items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className={`fas ${errorDetail.type === 'MIC_PERMISSION' ? 'fa-microphone-slash' : 'fa-triangle-exclamation'} text-xl`}></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm font-bold leading-relaxed">{errorDetail.message}</p>
                  {errorDetail.type === 'MIC_PERMISSION' && (
                    <p className="text-[10px] mt-1 opacity-60 uppercase tracking-widest font-black">Tip: Look for the camera/mic icon in your address bar to reset permissions.</p>
                  )}
                </div>
                <div className="flex gap-4 shrink-0">
                  {errorDetail.action && (
                    <button
                      onClick={errorDetail.action}
                      className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => setErrorDetail(null)}
                    className="px-6 py-2 bg-white/5 border border-white/10 text-white/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {stage === 'setup' && (
              <div className="max-w-3xl mx-auto space-y-10 animate-fade-in-up">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Target Role (Be Specific)</label>
                      <input
                        value={jobRole}
                        onChange={e => setJobRole(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-white placeholder-slate-600 font-bold"
                        placeholder="e.g. Senior Java Developer at TCS"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Interview Language</label>
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-white appearance-none cursor-pointer font-bold">
                        {LANGUAGES.map(lang => <option key={lang} value={lang} className="bg-navy-900">{lang}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Select Interviewer Style</label>
                    <div className="grid gap-3">
                      {Object.entries(PERSONAS).map(([key, p]) => {
                        const isSelected = persona === key;
                        const borderColor = key === 'mentor' ? 'border-emerald-500' : key === 'recruiter' ? 'border-blue-500' : 'border-red-500';
                        const bgColor = key === 'mentor' ? 'bg-emerald-500/10' : key === 'recruiter' ? 'bg-blue-500/10' : 'bg-red-500/10';
                        const iconColor = key === 'mentor' ? 'text-emerald-500' : key === 'recruiter' ? 'text-blue-500' : 'text-red-500';

                        return (
                          <button
                            key={key}
                            onClick={() => setPersona(key as any)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group relative overflow-hidden ${isSelected ? `${borderColor} ${bgColor}` : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white text-navy-900' : 'bg-white/5 group-hover:bg-white/10'} ${isSelected ? '' : iconColor}`}>
                              <i className={`fas ${p.icon} text-lg`}></i>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-tight text-white">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">{p.level} Difficulty</p>
                            </div>
                            {isSelected && <div className={`absolute top-0 right-0 p-2 ${iconColor}`}><i className="fas fa-check-circle"></i></div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-navy-950 p-8 rounded-[2rem] border border-white/5 group/file relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resume Context (Optional)</h4>
                    {resumeFile && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-check-circle"></i> Context Loaded</span>}
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${resumeFile ? 'border-brand-500 bg-brand-500/5' : 'border-white/10 hover:border-brand-500/50'}`}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => e.target.files && parseResume(e.target.files[0])} />
                    <div className="text-3xl mb-4 text-brand-500"><i className={`fas ${resumeFile ? 'fa-file-circle-check' : 'fa-brain-circuit'}`}></i></div>
                    <p className="text-sm font-bold">{resumeFile ? resumeFile.name : "Upload Resume for tailored questions"}</p>
                    <p className="text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest">The AI will read your projects & skills</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={startInterviewFlow}
                    disabled={stage !== 'setup'}
                    className="w-full py-6 bg-brand-500 hover:bg-brand-600 rounded-2xl font-black text-2xl shadow-2xl shadow-brand-500/30 transition-all transform hover:-translate-y-1 active:scale-95 btn-shimmer disabled:opacity-50"
                  >
                    Start 100% Free Session
                  </button>
                  <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <i className="fas fa-lock text-brand-500"></i> No payment required • Private & Secure
                  </p>
                </div>
              </div>
            )}

            {(stage === 'parsing' || stage === 'initializing') && (
              <div className="h-[500px] flex flex-col items-center justify-center space-y-10">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-[6px] border-brand-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-[6px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <i className={`fas ${stage === 'parsing' ? 'fa-brain' : 'fa-bolt-lightning'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-brand-500 animate-pulse`}></i>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter">{stage === 'parsing' ? 'Analyzing Resume' : 'Connecting to AI Agent'}</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">Preparing your personalized interview questions...</p>
                  <button onClick={() => setStage('setup')} className="mt-8 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors underline">Cancel Session</button>
                </div>
              </div>
            )}

            {stage === 'interview' && (
              <div className="grid lg:grid-cols-[1fr_400px] gap-12 animate-fade-in items-start">
                <div className="space-y-8">
                  <div className="bg-navy-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative group">
                    <canvas ref={canvasRef} width={800} height={350} className="w-full h-72" />
                    <div className="absolute top-6 left-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center animate-pulse">
                        <i className="fas fa-microphone text-xl"></i>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-white/50">Listening...</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-12 rounded-[3rem] border border-white/5 min-h-[250px] flex flex-col justify-center text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>
                    <p className="text-[10px] font-black text-brand-400 mb-6 uppercase tracking-[0.5em]">Live Transcription</p>
                    <p className="text-2xl md:text-3xl font-bold leading-tight italic text-slate-100 px-4">
                      {liveAiText ? `"${liveAiText}"` : liveUserText ? "You speaking..." : "Interviewer is analyzing..."}
                    </p>

                    {/* Missing Voice Warning */}
                    {voiceWarning && (
                      <div className="mt-6 mx-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-left flex items-start gap-4">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                        <div>
                          <p className="text-yellow-400 font-bold text-xs uppercase tracking-wide mb-1">Voice Missing</p>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            Your device doesn't have a <strong>{voiceWarning}</strong> text-to-speech voice installed.
                            <br /><span className="opacity-70 mt-1 block">To fix: Go to Windows Settings {'>'} Time & Language {'>'} Speech {'>'} Add a voice, and install <strong>{voiceWarning}</strong> (or Hindi).</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Debug Info Removed */}
                  </div>

                  <button onClick={stopAndFeedback} className="w-full py-6 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 group">
                    <i className="fas fa-flag-checkered group-hover:rotate-12 transition-transform"></i>
                    Finish & Get Score
                  </button>
                </div>

                <div className="bg-navy-950/80 p-8 rounded-[3rem] border border-white/10 flex flex-col h-[700px] shadow-2xl">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Transcript</h3>
                    <div className="px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full text-[8px] font-black uppercase">{persona} Mode</div>
                  </div>

                  <div className="flex-grow overflow-y-auto custom-scrollbar space-y-8 pr-4">
                    {transcripts.length === 0 && !liveUserText && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <i className="fas fa-wave-square text-5xl mb-6"></i>
                        <p className="text-xs font-black uppercase tracking-widest">Waiting for conversation</p>
                      </div>
                    )}
                    {transcripts.map((t, i) => (
                      <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2rem] text-sm leading-relaxed max-w-[90%] shadow-xl font-medium ${t.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'}`}>
                          {t.text}
                        </div>
                      </div>
                    ))}
                    {liveUserText && (
                      <div className="flex flex-col items-end animate-pulse">
                        <div className="p-6 rounded-[2rem] text-sm bg-brand-600/40 text-white rounded-tr-none italic">
                          {liveUserText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {stage === 'processing_feedback' && (
              <div className="h-[500px] flex flex-col items-center justify-center space-y-10">
                <div className="w-24 h-24 bg-brand-500/10 rounded-full flex items-center justify-center border border-brand-500/20 shadow-2xl">
                  <i className="fas fa-microchip text-4xl text-brand-500 animate-bounce"></i>
                </div>
                <div className="text-center">
                  <h3 className="text-4xl font-black mb-4 tracking-tighter">Calculating Score</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">Analyzing your confidence, keyword usage, and answer structure...</p>
                </div>
              </div>
            )}

            {stage === 'feedback' && feedback && (
              <div className="animate-fade-in-up space-y-16">
                <div className="text-center">
                  <div className="relative inline-block mb-10">
                    <svg className="w-56 h-56 transform -rotate-90">
                      <circle cx="112" cy="112" r="100" className="stroke-slate-100 fill-none" strokeWidth="12" />
                      <circle cx="112" cy="112" r="100" className="stroke-brand-500 fill-none transition-all duration-[3s] ease-out" strokeWidth="12" strokeDasharray="628" strokeDashoffset={628 - (628 * feedback.score / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-7xl font-black text-navy-950">{feedback.score}</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mastery Index</p>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Simulation Report</h2>
                  <p className="text-slate-600 text-xl max-w-3xl mx-auto leading-relaxed italic border-l-4 border-brand-500 pl-8 py-2">"{feedback.summary}"</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="bg-green-500/5 p-10 rounded-[3rem] border border-green-500/10 shadow-sm">
                    <h4 className="text-green-600 font-black text-xs mb-8 flex items-center gap-4 uppercase tracking-widest">
                      <i className="fas fa-shield-check text-xl"></i> Your Strengths
                    </h4>
                    <ul className="space-y-6">
                      {feedback.strengths.map((s, i) => (
                        <li key={i} className="flex gap-5 text-sm font-bold text-slate-700">
                          <span className="w-8 h-8 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">0{i + 1}</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-500/5 p-10 rounded-[3rem] border border-red-500/10 shadow-sm">
                    <h4 className="text-red-600 font-black text-xs mb-8 flex items-center gap-4 uppercase tracking-widest">
                      <i className="fas fa-triangle-exclamation text-xl"></i> Areas to Improve
                    </h4>
                    <ul className="space-y-6">
                      {feedback.weaknesses.map((w, i) => (
                        <li key={i} className="flex gap-5 text-sm font-bold text-slate-700">
                          <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">0{i + 1}</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-brand-500/5 p-12 rounded-[3.5rem] border border-brand-500/10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32"></div>
                  <h4 className="text-brand-600 font-black text-xs mb-10 flex items-center gap-4 uppercase tracking-widest">
                    <i className="fas fa-sparkles text-xl"></i> Executive Tip
                  </h4>
                  <div className="p-8 bg-white rounded-3xl border border-brand-500/20 shadow-inner">
                    <p className="text-lg text-slate-800 leading-relaxed font-bold italic">"{feedback.idealResponseTip}"</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-10 print:hidden">
                  <button onClick={() => setStage('setup')} className="flex-1 py-6 bg-navy-900 text-white hover:bg-navy-800 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95">Restart Free Simulation</button>
                  <button onClick={() => window.print()} className="flex-1 py-6 bg-brand-500 text-white hover:bg-brand-600 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95">Export Report</button>
                </div>
              </div>
            )}
          </div>
        </div>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-navy-950 rounded-[2rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative overflow-hidden text-center transform transition-all scale-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-blue-600"></div>
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-600 text-3xl">
                <i className="fas fa-rocket"></i>
              </div>
              <h3 className="text-3xl font-black mb-6 tracking-tight">Premium feature coming soon!</h3>

              <div className="text-left max-w-xs mx-auto space-y-4 mb-8">
                <div className="flex items-center gap-4 text-slate-700 font-bold text-lg">
                  <i className="fas fa-check-circle text-green-500 text-xl"></i> AI Interview feedback
                </div>
                <div className="flex items-center gap-4 text-slate-700 font-bold text-lg">
                  <i className="fas fa-check-circle text-green-500 text-xl"></i> High-quality PDF export
                </div>
                <div className="flex items-center gap-4 text-slate-700 font-bold text-lg">
                  <i className="fas fa-check-circle text-green-500 text-xl"></i> Resume improvement
                </div>
              </div>

              <div className="bg-brand-500/10 p-4 rounded-xl border border-brand-500/20 mb-8 inline-block">
                <p className="text-brand-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  <i className="fas fa-gift animate-bounce"></i> Early users get FREE credits
                </p>
              </div>

              <div className="space-y-4">
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-1">
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  export default LiveInterview;

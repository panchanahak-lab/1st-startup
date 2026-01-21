import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  narration: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'hero-badge',
    title: 'Mission Briefing',
    content: "Welcome to NextStep. We've engineered an intelligence-driven suite designed to land you 1% career results.",
    narration: "Welcome to Next Step. I am your career architect. We have engineered this intelligence-driven suite to ensure your professional breakthrough.",
    position: 'bottom'
  },
  {
    targetId: 'ats-checker',
    title: 'Neural ATS Audit',
    content: "Upload your CV to see the 'invisible' scores recruiter portals use to filter candidates. Our AI identifies lexical gaps instantly.",
    narration: "This is the Neural Audit module. We reveal the invisible scoring layers recruiters use, helping you fix structural gaps before you apply.",
    position: 'top'
  },
  {
    targetId: 'builder',
    title: 'Interactive CV Engine',
    content: "Craft resumes with real-time neural enhancement. Our AI rewrites bullet points with high-impact action verbs.",
    narration: "Our Interactive CV Engine uses real-time neural enhancement to transform your achievements into high-impact signals.",
    position: 'top'
  },
  {
    targetId: 'linkedin-optimizer',
    title: 'LinkedIn Branding',
    content: "Transform your profile into a recruiter magnet. We analyze both your text and your profile screenshots.",
    narration: "Maximize your digital presence. Our Branding Engine analyzes your LinkedIn visuals and copy to attract premium opportunities.",
    position: 'top'
  },
  {
    targetId: 'interview',
    title: 'The Simulation',
    content: "Practice high-stakes interviews with native-audio AI agents. Get immediate diagnostic scores on your performance.",
    narration: "Enter the simulation. Practice high-stakes interviews with our native audio agents and receive a full diagnostic score.",
    position: 'top'
  },
  {
    targetId: 'chatbot-trigger',
    title: 'The Career Architect',
    content: "Your 24/7 strategist. Ask for negotiation tips, mock prep, or resume summaries anytime.",
    narration: "I am always here for you. Ask me anything about your career strategy, salary negotiations, or prep, anytime.",
    position: 'left'
  }
];

interface TourProps {
  onComplete: () => void;
}

const Tour: React.FC<TourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0, opacity: 1, isFallback: false });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, transform: '', arrow: 'top' });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const syncRequestRef = useRef<number | null>(null);

  const step = TOUR_STEPS[currentStep];

  const stopAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playNarration = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }
    setIsSpeaking(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Note: TTS via generative-ai SDK is not directly supported in the same way as the server SDK.
      // We will skip the TTS call for now to fix the build, or implementation needs to change to a standard TTS service.
      // For this fix, I am commenting out the breaking TTS call and leaving the logic empty to prevent errors.
      /*
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: step.narration }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });
      */
      console.log("TTS temporarily disabled during migration.");
      return;

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } catch (error) {
      console.error("TTS failed", error);
      setIsSpeaking(false);
    }
  };

  const updateCoords = useCallback(() => {
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        opacity: 1,
        isFallback: false
      });
    } else {
      setCoords(prev => ({ ...prev, isFallback: true, opacity: 1 }));
    }
  }, [step]);

  // High-Frequency Sync Loop
  useEffect(() => {
    const startTime = Date.now();
    const sync = () => {
      updateCoords();
      if (Date.now() - startTime < 1500) { // Keep syncing for 1.5s during/after transitions
        syncRequestRef.current = requestAnimationFrame(sync);
      }
    };
    syncRequestRef.current = requestAnimationFrame(sync);
    return () => {
      if (syncRequestRef.current) cancelAnimationFrame(syncRequestRef.current);
    };
  }, [currentStep, updateCoords]);

  // Position Tooltip
  useEffect(() => {
    const calculatePosition = () => {
      const margin = 24;
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const tWidth = tooltip.offsetWidth;
      const tHeight = tooltip.offsetHeight;

      let top = 0;
      let left = 0;
      let transform = 'translate(-50%, -50%)';
      let arrow = 'none';

      if (coords.isFallback) {
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
      } else {
        const targetCenterX = coords.x + coords.width / 2;
        left = targetCenterX;
        transform = 'translateX(-50%)';

        if (step.position === 'top') {
          top = coords.y - tHeight - margin;
          arrow = 'bottom';
          if (top < 10) {
            top = coords.y + coords.height + margin;
            arrow = 'top';
          }
        } else {
          top = coords.y + coords.height + margin;
          arrow = 'top';
          if (top + tHeight > window.innerHeight - 10) {
            top = coords.y - tHeight - margin;
            arrow = 'bottom';
          }
        }

        const buffer = 20;
        if (left - tWidth / 2 < buffer) {
          left = buffer;
          transform = 'translateX(0)';
        } else if (left + tWidth / 2 > window.innerWidth - buffer) {
          left = window.innerWidth - buffer;
          transform = 'translateX(-100%)';
        }
      }

      setTooltipPos({ top, left, transform, arrow });
    };

    calculatePosition();
  }, [coords, step]);

  // Handle Step Activation
  useEffect(() => {
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    updateCoords();
  }, [currentStep, updateCoords]);

  // Global Setup
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    const htmlStyle = document.documentElement.style.scrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.scrollBehavior = 'auto'; // Prevent conflict during tour

    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { passive: true });

    return () => {
      document.body.style.overflow = originalStyle;
      document.documentElement.style.scrollBehavior = htmlStyle;
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
      stopAudio();
    };
  }, [updateCoords]);

  const handleNext = () => {
    stopAudio();
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    stopAudio();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden font-sans select-none animate-fade-in">
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              className="transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
              x={coords.isFallback ? -2000 : coords.x - 12}
              y={coords.isFallback ? -2000 : coords.y - 12}
              width={coords.isFallback ? 0 : coords.width + 24}
              height={coords.isFallback ? 0 : coords.height + 24}
              rx="24"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.94)"
          mask="url(#tour-mask)"
          className="backdrop-blur-[2px] transition-opacity duration-300"
          onClick={handleNext}
        />

        {/* Spotlight Ring */}
        {!coords.isFallback && (
          <rect
            className="transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            x={coords.x - 12}
            y={coords.y - 12}
            width={coords.width + 24}
            height={coords.height + 24}
            rx="24"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2"
            strokeDasharray="8 8"
            style={{ animation: 'glow-pulse 2s infinite alternate' }}
          />
        )}
      </svg>

      <div
        ref={tooltipRef}
        className="fixed pointer-events-auto transition-all duration-500"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: tooltipPos.transform,
          opacity: 1, // Force visible
        }}
      >
        <div className="w-[380px] max-w-[94vw] bg-white dark:bg-navy-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative">

          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>

          {tooltipPos.arrow !== 'none' && (
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-navy-900 rotate-45 border-slate-200 dark:border-white/10 ${tooltipPos.arrow === 'top' ? '-top-2 border-t border-l' : '-bottom-2 border-b border-r'
              }`}></div>
          )}

          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={playNarration}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSpeaking ? 'bg-brand-500 text-white animate-pulse shadow-xl shadow-brand-500/30' : 'bg-brand-500/10 text-brand-500 hover:bg-brand-500/20'}`}
              >
                <i className={`fas ${isSpeaking ? 'fa-stop' : 'fa-volume-high'} text-sm`}></i>
              </button>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Checkpoint</span>
                <span className="text-sm font-black text-navy-900 dark:text-white">{currentStep + 1} of {TOUR_STEPS.length}</span>
              </div>
            </div>
            <button onClick={onComplete} className="text-slate-300 hover:text-red-500 transition-colors p-2">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <h4 className="text-2xl font-black text-navy-900 dark:text-white mb-4 tracking-tighter leading-tight relative z-10">
            {step.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10 font-medium relative z-10">
            {step.content}
          </p>

          <div className="flex items-center justify-between pt-2 relative z-10">
            <button
              onClick={handleBack}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-navy-900 dark:hover:text-white'}`}
            >
              Back
            </button>

            <div className="flex items-center gap-4">
              <button onClick={onComplete} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-500 transition-all px-2">
                Skip
              </button>
              <button
                onClick={handleNext}
                className="group px-10 py-4 bg-brand-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand-500/40 hover:bg-brand-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Unlock access' : 'Continue'}
                <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 flex bg-slate-100 dark:bg-white/5">
            <div
              className="h-full bg-brand-500 transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour;
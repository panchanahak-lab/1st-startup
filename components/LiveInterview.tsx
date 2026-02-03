import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useAuth } from '../lib/AuthContext';
import { verifyCredits, ToolAccessError } from '../lib/toolAccess';
import { CREDIT_COSTS } from '../lib/pricing';
import {
  InterviewSession,
  createInterviewSession,
  getCurrentQuestion,
  recordAnswer,
  isInterviewComplete,
  getOpeningGreeting,
  formatQuestionNaturally,
  buildFeedbackPrompt
} from '../lib/interviewEngine';
import {
  useInterviewState,
  InterviewState,
  getStateLabel,
  getStateIcon,
  getStateColor,
  RECRUITER_PERSONALITIES,
  RecruiterPersonality,
  getTransitionPhrase,
  getChallengePhrase,
  getThinkingDelay,
  shouldChallenge
} from '../lib/useInterviewState';
import {
  scoreInterview,
  extractCVKeywords,
  extractExpectedSkills,
  InterviewScore
} from '../lib/interviewScoring';

interface TranscriptItem {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface CombinedFeedback {
  aiSummary: string;
  aiTip: string;
  ruleScore: InterviewScore;
}

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati',
  'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Assamese', 'Maithili', 'Santali',
  'Kashmiri', 'Nepali', 'Konkani', 'Sindhi', 'Dogri', 'Manipuri', 'Bodo', 'Sanskrit',
  'Bhojpuri', 'Spanish', 'French', 'German', 'Japanese', 'Mandarin'
];

const LANGUAGE_CODES: Record<string, string> = {
  'English': 'en-US', 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Telugu': 'te-IN',
  'Marathi': 'mr-IN', 'Tamil': 'ta-IN', 'Urdu': 'ur-IN', 'Gujarati': 'gu-IN',
  'Kannada': 'kn-IN', 'Malayalam': 'ml-IN', 'Odia': 'or-IN', 'Punjabi': 'pa-IN',
  'Assamese': 'as-IN', 'Nepali': 'ne-IN', 'Spanish': 'es-ES', 'French': 'fr-FR',
  'German': 'de-DE', 'Japanese': 'ja-JP', 'Mandarin': 'zh-CN'
};

interface ErrorDetail {
  type: 'MIC_PERMISSION' | 'NETWORK' | 'AI_SYNC' | 'PARSING' | 'GENERIC';
  message: string;
  action?: () => void;
}

const LiveInterview: React.FC = () => {
  const { user, session } = useAuth();

  // State machine
  const { state, context, transitionTo, reset: resetStateMachine, setQuestionCount } = useInterviewState();

  // UI State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeContext, setResumeContext] = useState<string>('');
  const [jobRole, setJobRole] = useState<string>('');
  const [language, setLanguage] = useState('English');
  const [persona, setPersona] = useState<keyof typeof RECRUITER_PERSONALITIES>('recruiter');
  const [feedback, setFeedback] = useState<CombinedFeedback | null>(null);
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAiText, setLiveAiText] = useState('');

  // Interview session
  const interviewSessionRef = useRef<InterviewSession | null>(null);
  const personalityRef = useRef<RecruiterPersonality>(RECRUITER_PERSONALITIES.recruiter);

  // Audio refs
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>('');

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Select voice based on language
  useEffect(() => {
    if (voices.length > 0) {
      const langCode = LANGUAGE_CODES[language] || 'en-US';
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
        voices.find(v => v.lang.startsWith('en'));
      setSelectedVoice(matchingVoice || null);
      setVoiceWarning(!matchingVoice ? language : null);
    }
  }, [language, voices]);

  // Update personality when persona changes
  useEffect(() => {
    personalityRef.current = RECRUITER_PERSONALITIES[persona];
  }, [persona]);

  /**
   * Cleanup all audio resources
   */
  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, []);

  /**
   * Parse resume and extract context
   */
  const parseResume = async (file: File) => {
    setResumeFile(file);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let text = reader.result as string;
        if (file.type === 'application/pdf') {
          text = `Resume uploaded: ${file.name}`;
        }
        const context = text.substring(0, 2000);
        setResumeContext(context);
      } catch (err: any) {
        setErrorDetail({
          type: 'PARSING',
          message: "Unable to parse resume. Please try a different file format."
        });
      }
    };
    reader.onerror = () => {
      setErrorDetail({ type: 'PARSING', message: "Error reading file." });
    };
    reader.readAsText(file);
  };

  /**
   * Draw audio visualizer
   */
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  }, []);

  /**
   * Speak text using TTS (returns promise)
   */
  const speakTextAsync = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Adjust rate based on personality
      const personality = personalityRef.current;
      utterance.rate = personality.pressureLevel > 7 ? 1.1 : 0.95;
      utterance.pitch = 1.0;

      isSpeakingRef.current = true;

      utterance.onend = () => {
        isSpeakingRef.current = false;
        resolve();
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [selectedVoice]);
  // PAUSE/RESUME LOGIC
  const pausedStateRef = useRef<InterviewState | null>(null);

  const pauseInterview = useCallback(() => {
    if (state === 'PAUSED') return;

    // Stop audio
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;

    // Save previous state
    pausedStateRef.current = state;
    transitionTo('PAUSED');
  }, [state, transitionTo]);

  const resumeInterview = useCallback(async () => {
    if (state !== 'PAUSED' || !pausedStateRef.current) return;

    const previousState = pausedStateRef.current;
    transitionTo(previousState);

    // Resume actions based on state
    if (previousState === 'ASK_QUESTION' || previousState === 'ASK_FOLLOW_UP') {
      // Re-speak current text
      if (liveAiText) {
        await speakTextAsync(liveAiText);
        // Only transition to listening if we finished speaking naturally
        if (state === 'ASK_QUESTION') transitionTo('LISTENING');
      }
    } else if (previousState === 'LISTENING') {
      startListening();
    }
  }, [state, liveAiText, speakTextAsync, transitionTo]);


  /**
   * Translate session content (One-time setup for non-English)
   */
  const translateSession = async (session: InterviewSession) => {
    if (language === 'English') return session;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return session;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const greetingCode = getOpeningGreeting({ jobRole, language, persona });

      const questionsToTranslate = session.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
      const prompt = `Translate the following interview content into ${language}.
Keep the professional tone.

Greeting: "${greetingCode}"

Questions:
${questionsToTranslate}

Return ONLY a JSON object with this format:
{
  "greeting": "Translated greeting text",
  "questions": ["Translated question 1", "Translated question 2", ...]
}`;

      const res = await model.generateContent(prompt);
      const cleanText = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const translation = JSON.parse(cleanText);

      return {
        ...session,
        translatedGreeting: translation.greeting,
        translatedQuestions: translation.questions
      };

    } catch (e) {
      console.error("Translation failed:", e);
      return session; // Fallback to English
    }
  };

  /**
   * Start the interview flow
   */
  const startInterviewFlow = async () => {
    if (!jobRole) {
      alert("Please specify the job role.");
      return;
    }

    // Credit check
    if (user?.id) {
      try {
        await verifyCredits(session, CREDIT_COSTS.INTERVIEW_PREP);
      } catch (e: any) {
        if (e instanceof ToolAccessError && (e.code === 'NO_CREDITS' || e.code === 'INSUFFICIENT_CREDITS')) {
          setShowUpgradeModal(true);
          return;
        }
        alert(e.message);
        return;
      }
    }

    // Transition: IDLE -> SETUP -> INITIALIZING
    transitionTo('SETUP');
    setErrorDetail(null);
    setTranscripts([]);
    setFeedback(null);

    try {
      transitionTo('INITIALIZING');

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw { type: 'MIC_PERMISSION', message: "Microphone access denied. Please allow microphone access." };
        }
        throw { type: 'MIC_PERMISSION', message: "Unable to access microphone." };
      });

      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await inputCtx.resume();
      inputAudioContextRef.current = inputCtx;

      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create interview session
      let interviewSession = createInterviewSession({
        jobRole,
        language,
        persona,
        cvSummary: resumeContext,
        questionCount: 5
      });

      // Translate if needed (ONE-TIME call)
      if (language !== 'English') {
        setLiveAiText(`Translating interview to ${language}...`);
        interviewSession = await translateSession(interviewSession);
      }

      interviewSessionRef.current = interviewSession;
      setQuestionCount(1, interviewSession.questions.length);

      drawVisualizer();

      // Transition: INITIALIZING -> ASK_QUESTION
      transitionTo('ASK_QUESTION');

      // Opening greeting
      const greeting = interviewSession.translatedGreeting || getOpeningGreeting({ jobRole, language, persona });
      setLiveAiText(greeting);
      setTranscripts([{ role: 'ai', text: greeting, timestamp: Date.now() }]);
      await speakTextAsync(greeting);

      // Ask first question
      await askCurrentQuestion();

    } catch (err: any) {
      console.error(err);
      cleanupAudio();
      resetStateMachine();
      setErrorDetail({
        type: err.type || 'GENERIC',
        message: err.message || "An unexpected error occurred.",
        action: startInterviewFlow
      });
    }
  };

  /**
   * Ask the current question
   */
  const askCurrentQuestion = async () => {
    const session = interviewSessionRef.current;
    if (!session) return;

    const question = getCurrentQuestion(session);
    if (!question) {
      await stopAndFeedback();
      return;
    }

    // Get translated text if available
    let questionText = session.translatedQuestions?.[session.currentIndex] || question.question;

    // Apply natural formatting ONLY for English to avoid weird prefixes in other langs
    if (language === 'English') {
      questionText = formatQuestionNaturally(question, persona);
    }
    setLiveAiText(questionText);
    setTranscripts(prev => [...prev, { role: 'ai', text: questionText, timestamp: Date.now() }]);

    await speakTextAsync(questionText);

    // Transition: ASK_QUESTION -> LISTENING
    transitionTo('LISTENING');
    startListening();
  };

  /**
   * Start speech recognition
   */
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support speech recognition. Please use Chrome.");
      return;
    }

    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANGUAGE_CODES[language] || 'en-US';

    recognitionRef.current = recognition;

    let finalTranscript = '';
    let silenceTimeout: NodeJS.Timeout;

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimeout);
      // Personality affects patience - stress interviewer waits less
      const patience = personalityRef.current.pressureLevel > 7 ? 1500 : 2500;
      silenceTimeout = setTimeout(() => {
        if (finalTranscript.trim().length > 10) {
          recognition.stop();
          handleUserResponse(finalTranscript);
        }
      }, patience);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setLiveUserText(finalTranscript + interimTranscript);
      currentTranscriptRef.current = finalTranscript + interimTranscript;
      resetSilenceTimer();
    };

    recognition.onerror = () => {
      clearTimeout(silenceTimeout);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimeout);
      if (finalTranscript.trim().length > 10 && state === 'LISTENING') {
        handleUserResponse(finalTranscript);
      }
    };

    recognition.start();
    setLiveUserText('');
    setLiveAiText('');
    currentTranscriptRef.current = '';
    resetSilenceTimer();
  };

  /**
   * Handle "Done" button click - manual answer completion
   */
  const handleDoneClick = useCallback(() => {
    if (state === 'PAUSED') return;

    const transcript = currentTranscriptRef.current.trim();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    if (transcript.length > 10) {
      handleUserResponse(transcript);
    } else {
      // If no meaningful transcript, just skip
      skipQuestion();
    }
  }, []);

  /**
   * Handle user's completed answer
   */
  const handleUserResponse = async (userText: string) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    // Record in transcript
    setTranscripts(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
    setLiveUserText('');

    // Update session
    const session = interviewSessionRef.current;
    if (session) {
      interviewSessionRef.current = recordAnswer(session, userText);
      setQuestionCount(
        interviewSessionRef.current.currentIndex + 1,
        interviewSessionRef.current.questions.length
      );
    }

    // Transition: LISTENING -> PROCESSING
    transitionTo('PROCESSING');
    setLiveAiText('');

    // Human-like thinking delay based on personality
    const delay = getThinkingDelay(personalityRef.current);
    await new Promise(r => setTimeout(r, delay));

    // Check if complete
    if (interviewSessionRef.current && isInterviewComplete(interviewSessionRef.current)) {
      await stopAndFeedback();
      return;
    }

    // Transition phrase based on personality
    const personality = personalityRef.current;
    const transition = shouldChallenge(personality, 3)
      ? getChallengePhrase(personality)
      : getTransitionPhrase(personality);

    setLiveAiText(transition);
    await speakTextAsync(transition);

    await new Promise(r => setTimeout(r, 300));

    // Ask next question
    await askCurrentQuestion();
  };

  /**
   * End interview and generate feedback
   */
  const stopAndFeedback = async () => {
    cleanupAudio();

    // Transition: ... -> GENERATING_FEEDBACK
    transitionTo('GENERATING_FEEDBACK');
    setErrorDetail(null);

    const session = interviewSessionRef.current;
    if (!session || session.answers.length < 1) {
      setErrorDetail({
        type: 'GENERIC',
        message: "Not enough responses to generate feedback."
      });
      resetStateMachine();
      return;
    }

    try {
      // RULE-BASED SCORING (No AI)
      const cvKeywords = extractCVKeywords(session.cvSummary);
      const expectedSkills = extractExpectedSkills(session.jobRole);

      const ruleScore = scoreInterview(session.answers, {
        jobRole: session.jobRole,
        cvKeywords,
        expectedSkills
      });

      // AI SUMMARY (Single Gemini call)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let aiSummary = ruleScore.overallFeedback;
      let aiTip = ruleScore.improvements[0] || 'Keep practicing!';

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                  summary: { type: SchemaType.STRING },
                  tip: { type: SchemaType.STRING }
                },
                required: ["summary", "tip"]
              }
            }
          });

          const prompt = `You are evaluating an interview. Be concise.

ROLE: ${session.jobRole}
SCORE: ${ruleScore.percentage}%

ANSWERS (summarized):
${session.answers.slice(0, 3).map((a, i) => `Q${i + 1}: ${a.substring(0, 200)}...`).join('\n')}

Provide:
1. A 2-sentence summary of their performance
2. One specific actionable tip

Keep it encouraging but honest.`;

          const res = await model.generateContent(prompt);
          const aiData = JSON.parse(res.response.text());
          aiSummary = aiData.summary || aiSummary;
          aiTip = aiData.tip || aiTip;
        } catch (aiErr) {
          console.error('AI feedback error:', aiErr);
          // Fall back to rule-based feedback
        }
      }

      setFeedback({
        aiSummary,
        aiTip,
        ruleScore
      });

      // Transition: GENERATING_FEEDBACK -> COMPLETE
      transitionTo('COMPLETE');

    } catch (err: any) {
      console.error("Feedback error:", err);
      setErrorDetail({
        type: 'GENERIC',
        message: "Unable to generate feedback."
      });
      resetStateMachine();
    }
  };

  /**
   * Skip current question
   */
  const skipQuestion = async () => {
    const session = interviewSessionRef.current;
    if (session) {
      interviewSessionRef.current = recordAnswer(session, "[Skipped]");
      setQuestionCount(
        interviewSessionRef.current.currentIndex + 1,
        interviewSessionRef.current.questions.length
      );
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    setLiveUserText('');
    setTranscripts(prev => [...prev, { role: 'user', text: '[Skipped]', timestamp: Date.now() }]);

    if (interviewSessionRef.current && isInterviewComplete(interviewSessionRef.current)) {
      await stopAndFeedback();
      return;
    }

    transitionTo('PROCESSING');
    await new Promise(r => setTimeout(r, 500));
    await askCurrentQuestion();
  };

  /**
   * Reset and start over
   */
  const resetInterview = () => {
    cleanupAudio();
    resetStateMachine();
    setFeedback(null);
    setTranscripts([]);
    pausedStateRef.current = null;
    interviewSessionRef.current = null;
  };

  // Get current state styling
  const stateColor = getStateColor(state);
  const stateLabel = getStateLabel(state);
  const stateIcon = getStateIcon(state);

  // Determine if we're in active interview
  const isActiveInterview = ['ASK_QUESTION', 'LISTENING', 'PROCESSING', 'ASK_FOLLOW_UP', 'PAUSED'].includes(state);

  return (
    <section id="interview" className="py-24 bg-navy-950 min-h-[900px] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-brand-500/10 text-brand-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-brand-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Human-Like AI Interview
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500">Next Interview</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            {RECRUITER_PERSONALITIES[persona].pressureLevel > 7
              ? "High-pressure simulation. Get grilled like a real interview."
              : "Natural conversation flow with thinking pauses. Practice like the real thing."}
          </p>
        </div>

        <div className={`glass dark:bg-navy-900/40 rounded-[3rem] border border-white/5 backdrop-blur-2xl p-8 md:p-16 shadow-2xl relative overflow-hidden ${state === 'COMPLETE' ? 'bg-white !text-navy-950' : ''}`}>

          {/* Error Display */}
          {errorDetail && (
            <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <i className={`fas ${errorDetail.type === 'MIC_PERMISSION' ? 'fa-microphone-slash' : 'fa-triangle-exclamation'} text-xl`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{errorDetail.message}</p>
              </div>
              <div className="flex gap-4">
                {errorDetail.action && (
                  <button onClick={errorDetail.action} className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase">
                    Try Again
                  </button>
                )}
                <button onClick={() => setErrorDetail(null)} className="px-6 py-2 bg-white/5 text-white/50 rounded-xl text-xs font-black uppercase">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* IDLE/SETUP State */}
          {(state === 'IDLE' || state === 'SETUP') && (
            <div className="max-w-3xl mx-auto space-y-10 animate-fade-in-up">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Target Role</label>
                    <input
                      value={jobRole}
                      onChange={e => setJobRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-slate-600 font-bold focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold focus:ring-2 focus:ring-brand-500">
                      {LANGUAGES.map(lang => <option key={lang} value={lang} className="bg-navy-900">{lang}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Interviewer Mode</label>
                  <div className="grid gap-3">
                    {Object.entries(RECRUITER_PERSONALITIES).map(([key, p]) => {
                      const isSelected = persona === key;
                      const borderColor = key === 'mentor' ? 'border-emerald-500' : key === 'recruiter' ? 'border-blue-500' : 'border-red-500';
                      const bgColor = key === 'mentor' ? 'bg-emerald-500/10' : key === 'recruiter' ? 'bg-blue-500/10' : 'bg-red-500/10';
                      const iconColor = key === 'mentor' ? 'text-emerald-500' : key === 'recruiter' ? 'text-blue-500' : 'text-red-500';

                      return (
                        <button
                          key={key}
                          onClick={() => setPersona(key as any)}
                          className={`p-4 rounded-2xl border text-left flex items-center gap-4 ${isSelected ? `${borderColor} ${bgColor}` : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white text-navy-900' : `bg-white/5 ${iconColor}`}`}>
                            <i className={`fas ${p.icon} text-lg`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{p.level} • Pressure: {p.pressureLevel}/10</p>
                          </div>
                          {isSelected && <i className={`fas fa-check-circle ${iconColor}`}></i>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="bg-navy-950 p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resume (Optional)</h4>
                  {resumeFile && <span className="text-[10px] font-black text-green-500 flex items-center gap-2"><i className="fas fa-check-circle"></i>Loaded</span>}
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer ${resumeFile ? 'border-brand-500 bg-brand-500/5' : 'border-white/10 hover:border-brand-500/50'}`}
                >
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={e => e.target.files && parseResume(e.target.files[0])} />
                  <div className="text-3xl mb-4 text-brand-500"><i className={`fas ${resumeFile ? 'fa-file-check' : 'fa-file-upload'}`}></i></div>
                  <p className="text-sm font-bold">{resumeFile ? resumeFile.name : "Upload for tailored questions"}</p>
                </div>
              </div>

              <button
                onClick={startInterviewFlow}
                className="w-full py-6 bg-brand-500 hover:bg-brand-600 rounded-2xl font-black text-2xl shadow-2xl shadow-brand-500/30 transition-all hover:-translate-y-1"
              >
                Start Interview
              </button>
            </div>
          )}

          {/* INITIALIZING State */}
          {state === 'INITIALIZING' && (
            <div className="h-[500px] flex flex-col items-center justify-center space-y-10">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-[6px] border-brand-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <i className="fas fa-bolt-lightning absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-brand-500 animate-pulse"></i>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter">Preparing Interview</h3>
                <p className="text-slate-500">Setting up your {RECRUITER_PERSONALITIES[persona].name} session...</p>
              </div>
            </div>
          )}

          {/* Active Interview States */}
          {
            isActiveInterview && (
              <div className="grid lg:grid-cols-[1fr_400px] gap-12 animate-fade-in items-start">
                <div className="space-y-8">
                  {/* State indicator */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-${stateColor}-500/10 border border-${stateColor}-500/20`}>
                      <i className={`fas ${stateIcon} text-${stateColor}-500`}></i>
                      <span className="text-sm font-bold">{stateLabel}</span>
                    </div>
                    <div className="flex gap-2">
                      {Array.from({ length: context.totalQuestions }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < context.questionNumber ? 'bg-brand-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Visualizer */}
                  <div className="bg-navy-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
                    <canvas ref={canvasRef} width={800} height={350} className="w-full h-72" />
                    <div className="absolute top-6 left-6 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${state === 'LISTENING' ? 'bg-brand-500 animate-pulse' :
                        state === 'PROCESSING' ? 'bg-yellow-500 animate-bounce' :
                          'bg-blue-500'
                        }`}>
                        <i className={`fas ${state === 'LISTENING' ? 'fa-microphone' :
                          state === 'PROCESSING' ? 'fa-brain' :
                            'fa-comment-dots'
                          } text-xl`}></i>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-white/50">
                        {stateLabel}
                      </span>
                    </div>
                    <div className="absolute top-6 right-6">
                      <div className="flex gap-2">
                        {/* Pause Button */}
                        <button
                          onClick={state === 'PAUSED' ? resumeInterview : pauseInterview}
                          className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold transition-all ${state === 'PAUSED'
                            ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                          <i className="fas fa-play mr-2"></i>
                          <span className="hidden md:inline">{state === 'PAUSED' ? 'Resume' : 'Pause'}</span>
                        </button>

                        {/* Exit Button - Abort */}
                        <button
                          onClick={resetInterview}
                          className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl transition-all"
                          title="Exit Interview"
                        >
                          <i className="fas fa-times"></i>
                        </button>

                        <button
                          onClick={stopAndFeedback}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-black uppercase transition-all"
                        >
                          End Interview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PAUSED OVERLAY */}
                  {state === 'PAUSED' && (
                    <div className="relative p-8 rounded-3xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-md text-center py-20 animate-fade-in z-50">
                      <div className="inline-flex w-20 h-20 rounded-full bg-slate-800 items-center justify-center mb-6">
                        <i className="fas fa-pause text-3xl text-slate-400"></i>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Interview Paused</h3>
                      <p className="text-slate-400 mb-8">Take a break. Your progress is saved.</p>
                      <button
                        onClick={resumeInterview}
                        className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:scale-105 transition-all"
                      >
                        <i className="fas fa-play mr-2"></i> Resume Interview
                      </button>
                    </div>
                  )}

                  {state !== 'PAUSED' && (
                    <>
                      <div className="bg-white/5 p-12 rounded-[3rem] border border-white/5 min-h-[200px] flex flex-col justify-center text-center">
                        {state === 'PROCESSING' ? (
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                              <span className="w-4 h-4 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-4 h-4 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-4 h-4 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <p className="text-sm text-slate-400 italic">Thinking of the next question...</p>
                          </div>
                        ) : state === 'LISTENING' && liveUserText ? (
                          <>
                            <p className="text-[10px] font-black text-brand-400 mb-4 uppercase tracking-widest">Your Response</p>
                            <p className="text-2xl font-bold italic text-slate-100">"{liveUserText}"</p>
                          </>
                        ) : liveAiText ? (
                          <>
                            <p className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest">Interviewer</p>
                            <p className="text-2xl font-bold italic text-slate-100">"{liveAiText}"</p>
                          </>
                        ) : (
                          <p className="text-slate-500 italic">Listening silently...</p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex gap-4">
                        {state === 'LISTENING' && (
                          <>
                            <button onClick={handleDoneClick} className="flex-1 py-4 bg-brand-500/10 hover:bg-brand-500 border border-brand-500/20 text-brand-400 hover:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                              <i className="fas fa-check-circle"></i> Done Speaking
                            </button>
                            <button onClick={skipQuestion} className="py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                              <i className="fas fa-forward"></i> Skip
                            </button>
                          </>
                        )}
                        <button onClick={stopAndFeedback} className="flex-1 py-6 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-4">
                          <i className="fas fa-flag-checkered"></i> End Interview
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Transcript */}
                <div className="bg-navy-950/80 p-8 rounded-[3rem] border border-white/10 flex flex-col h-[700px]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transcript</h3>
                    <div className={`px-3 py-1 bg-${RECRUITER_PERSONALITIES[persona].color}-500/10 text-${RECRUITER_PERSONALITIES[persona].color}-500 rounded-full text-[8px] font-black uppercase`}>
                      {persona} mode
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-6 pr-4">
                    {transcripts.map((t, i) => (
                      <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-2xl text-sm max-w-[90%] ${t.role === 'user'
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'
                          }`}>
                          {t.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          {/* GENERATING_FEEDBACK State */}
          {
            state === 'GENERATING_FEEDBACK' && (
              <div className="h-[500px] flex flex-col items-center justify-center space-y-10">
                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                  <i className="fas fa-chart-line text-4xl text-purple-500 animate-pulse"></i>
                </div>
                <div className="text-center">
                  <h3 className="text-4xl font-black mb-4">Analyzing Performance</h3>
                  <p className="text-slate-500">Scoring your answers across 5 dimensions...</p>
                </div>
              </div>
            )
          }

          {/* COMPLETE State - Feedback */}
          {
            state === 'COMPLETE' && feedback && (
              <div className="animate-fade-in-up space-y-12">
                {/* Score Circle */}
                <div className="text-center">
                  <div className="relative inline-block mb-8">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="85" className="stroke-slate-200 fill-none" strokeWidth="10" />
                      <circle cx="96" cy="96" r="85" className="stroke-brand-500 fill-none transition-all duration-[2s]" strokeWidth="10" strokeDasharray="534" strokeDashoffset={534 - (534 * feedback.ruleScore.percentage / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-5xl font-black text-navy-950">{feedback.ruleScore.percentage}</span>
                      <span className="text-xl text-navy-950">%</span>
                      <p className="text-[10px] font-black uppercase text-slate-400">Overall Score</p>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black uppercase mb-4">Interview Report</h2>
                  <p className="text-slate-600 text-lg max-w-2xl mx-auto italic border-l-4 border-brand-500 pl-6">"{feedback.aiSummary}"</p>
                </div>

                {/* Dimension Scores */}
                <div className="grid md:grid-cols-5 gap-4">
                  {feedback.ruleScore.dimensions.map((dim, i) => {
                    const percentage = (dim.score / 5) * 100;
                    const barColor = dim.score >= 4 ? 'bg-green-500' : dim.score >= 3 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-black text-slate-700">{dim.score}</span>
                          <span className="text-[10px] text-slate-400">/5</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400">{dim.name}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-green-50 p-8 rounded-2xl border border-green-200">
                    <h4 className="text-green-700 font-black text-sm mb-4 flex items-center gap-2">
                      <i className="fas fa-check-circle"></i> Strengths
                    </h4>
                    <ul className="space-y-3">
                      {feedback.ruleScore.strengths.map((s, i) => (
                        <li key={i} className="text-slate-700 text-sm">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-8 rounded-2xl border border-amber-200">
                    <h4 className="text-amber-700 font-black text-sm mb-4 flex items-center gap-2">
                      <i className="fas fa-lightbulb"></i> Areas to Improve
                    </h4>
                    <ul className="space-y-3">
                      {feedback.ruleScore.improvements.map((s, i) => (
                        <li key={i} className="text-slate-700 text-sm">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-brand-50 p-8 rounded-2xl border border-brand-200">
                  <h4 className="text-brand-700 font-black text-sm mb-4 flex items-center gap-2">
                    <i className="fas fa-sparkles"></i> Pro Tip
                  </h4>
                  <p className="text-slate-700 text-lg italic">"{feedback.aiTip}"</p>
                </div>

                {/* Actions */}
                <div className="flex gap-6">
                  <button onClick={resetInterview} className="flex-1 py-5 bg-navy-900 text-white rounded-2xl font-black text-xl hover:bg-navy-800">
                    Try Again
                  </button>
                  <button onClick={() => window.print()} className="flex-1 py-5 bg-brand-500 text-white rounded-2xl font-black text-xl hover:bg-brand-600">
                    Export
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {
        showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
            <div className="bg-white text-navy-950 rounded-2xl p-8 max-w-lg w-full text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-600 text-3xl">
                <i className="fas fa-coins"></i>
              </div>
              <h3 className="text-2xl font-black mb-4">Credits Required</h3>
              <p className="text-slate-600 mb-6">Interview practice costs 1 credit. You'll get detailed feedback!</p>
              <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black">
                Got it!
              </button>
            </div>
          </div>
        )
      }
    </section>
  );
};

export default LiveInterview;

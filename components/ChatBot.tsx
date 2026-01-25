
import React, { useState, useRef, useEffect } from 'react';


interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_PROMPTS = [
  { label: 'Optimize my Summary', icon: 'fa-wand-magic-sparkles' },
  { label: 'ATS Keyword Check', icon: 'fa-magnifying-glass-chart' },
  { label: 'Mock Interview Prep', icon: 'fa-microphone' },
  { label: 'Salary Negotiation', icon: 'fa-comments-dollar' }
];

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to NextStep Intelligence. I'm your Career Architect. How shall we engineer your professional breakthrough today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input.trim();
    if (!textToSend || isTyping) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "System Reference: You are the NextStep Career Architect. Context: NextStep Resume provides an ATS Audit, CV Builder, and Interview Simulator." }],
          },
          {
            role: "model",
            parts: [{ text: "Understood. I am ready to assist as the Career Architect." }],
          },
        ],
      });

      const result = await chat.sendMessage(userMessage.text);
      const aiText = result.response.text();
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const isKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;
      const errorMessage = error.message || JSON.stringify(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: `Error: ${errorMessage}. (Key Loaded: ${!isKeyMissing})`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div id="chatbot-trigger" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] print:hidden">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl flex items-center justify-center text-white transition-all duration-500 transform hover:scale-110 active:scale-95 group relative overflow-hidden ${isOpen ? 'bg-navy-900 rotate-90 shadow-navy-900/20' : 'bg-brand-500 shadow-brand-500/40'
          }`}
        aria-label="Toggle Career Architect Chat"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-accent-purple opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bolt-lightning'} text-xl md:text-2xl relative z-10 transition-transform duration-500`}></i>

        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-500 border-2 border-white dark:border-navy-950"></span>
          </span>
        )}
      </button>

      {/* Premium Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 left-4 md:absolute md:bottom-20 md:right-0 md:left-auto w-auto md:w-[350px] max-w-full md:max-w-[calc(100vw-2rem)] h-[70dvh] md:h-[500px] md:max-h-[calc(100vh-120px)] bg-white dark:bg-navy-900 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-reveal z-[10000]"
        >
          {/* Header Area */}
          <div className="relative p-4 bg-navy-950 overflow-hidden shrink-0">
            <div className="aura-orb bg-brand-500 -top-20 -right-20 scale-50 opacity-10"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center shadow-lg">
                  <i className="fas fa-brain text-white text-base"></i>
                </div>
                <div>
                  <h3 className="text-white font-black text-sm md:text-base tracking-tight leading-none mb-0.5">Career Architect</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Intelligence Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-2"
                aria-label="Close Chat"
              >
                <i className="fas fa-times md:fa-minus"></i>
              </button>
            </div>
          </div>

          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-navy-950 custom-scrollbar relative">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-3 px-4 rounded-xl text-sm shadow-sm relative ${msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-none'
                  : 'bg-white dark:bg-navy-900 text-navy-900 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none shadow-md'
                  }`}>
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl rounded-tl-none flex gap-2 items-center shadow-md">
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Neural Shortcuts & Input */}
          <div className="p-3 bg-white dark:bg-navy-950 border-t border-slate-200 dark:border-white/10 space-y-3 shrink-0 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.label)}
                  className="shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:border-brand-500 transition-all flex items-center gap-2"
                >
                  <i className={`fas ${prompt.icon}`}></i>
                  {prompt.label}
                </button>
              ))}
            </div>

            <div className="relative flex items-center group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your Architect..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-navy-900 border border-transparent dark:border-white/5 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-navy-800 outline-none text-sm font-medium transition-all text-navy-900 dark:text-white"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all ${input.trim() && !isTyping ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-white/5 text-slate-400'
                  }`}
              >
                <i className={`fas ${isTyping ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-sm`}></i>
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default ChatBot;

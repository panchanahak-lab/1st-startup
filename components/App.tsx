import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhyChooseUs from './components/WhyChooseUs';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import BottomCTA from './components/BottomCTA';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ATSChecker from './components/ATSChecker';
import LiveInterview from './components/LiveInterview';
import ResumeBuilder from './components/ResumeBuilder';
import LinkedInOptimizer from './components/LinkedInOptimizer';
import ChatBot from './components/ChatBot';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const hour = new Date().getHours();
      setTheme(hour >= 18 || hour < 6 ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Navbar theme={theme} onToggleTheme={toggleTheme} onOpenAuth={openAuth} />
      <main>
        <Hero />
        <ATSChecker isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <LiveInterview />
        <ResumeBuilder />
        <LinkedInOptimizer />
        <WhyChooseUs />
        <Services />
        <Testimonials />
        <BottomCTA />
      </main>
      <ChatBot />
      <Footer />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </div>
  );
}

export default App;
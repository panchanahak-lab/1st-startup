
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
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
import Tour from './components/Tour';
import DesktopRecommendation from './components/DesktopRecommendation';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Initial Onboarding Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const hour = new Date().getHours();
      setTheme(hour >= 18 || hour < 6 ? 'dark' : 'light');
    }

    const hasSeenTour = localStorage.getItem('nextstep_tour_seen');
    if (!hasSeenTour) {
      // Small delay to let the landing page animations breathe
      const timer = setTimeout(() => setIsTourOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    const handleStartTour = () => setIsTourOpen(true);
    window.addEventListener('start-nextstep-tour', handleStartTour);
    return () => window.removeEventListener('start-nextstep-tour', handleStartTour);
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

  const completeTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('nextstep_tour_seen', 'true');
  };

  return (
    <div className="min-h-screen transition-colors duration-500 selection:bg-brand-500/30">
      <Navbar theme={theme} onToggleTheme={toggleTheme} onOpenAuth={openAuth} />
      <main>
        <Hero />
        <About />
        <ATSChecker isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <ResumeBuilder />
        <LinkedInOptimizer />
        <LiveInterview />
        <WhyChooseUs />
        <Services />
        <Testimonials />
        <BottomCTA />
      </main>
      <DesktopRecommendation />
      <ChatBot />
      <Footer />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
      {isTourOpen && <Tour onComplete={completeTour} />}
    </div>
  );
}

export default App;

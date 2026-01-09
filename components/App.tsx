
import React, { useState } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import WhyChooseUs from './WhyChooseUs';
import Services from './Services';
import Testimonials from './Testimonials';
import BottomCTA from './BottomCTA';
import Footer from './Footer';
import AuthModal from './AuthModal';
import ATSChecker from './ATSChecker';
import LiveInterview from './LiveInterview';
import ResumeBuilder from './ResumeBuilder';
import JobTracker from './JobTracker';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans animate-fade-in">
      <Navbar onOpenAuth={openAuth} />
      <main className="flex-grow">
        <Hero />
        <ATSChecker isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <ResumeBuilder />
        <JobTracker />
        <LiveInterview />
        <WhyChooseUs />
        <Services />
        <Testimonials />
        <BottomCTA />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={closeAuth} 
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;

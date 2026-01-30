
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import WhyChooseUs from './WhyChooseUs';
import Services from './Services';
import Testimonials from './Testimonials';
import BottomCTA from './BottomCTA';
import Footer from './Footer';
import AuthModal from './AuthModal';
import ATSChecker from './ATSChecker';
import LiveInterview from './LiveInterview';
import ResumeBuilder from './ResumeBuilder';
import LinkedInOptimizer from './LinkedInOptimizer';
import ChatBot from './ChatBot';

import DesktopRecommendation from './DesktopRecommendation';

import BackToTop from './BackToTop';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');


    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    // Redirect logic removed to allow users to view the landing page
    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Initial Onboarding Logic
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
        <div className="min-h-screen transition-colors duration-500 selection:bg-brand-500/30">
            <Navbar theme={theme} onToggleTheme={toggleTheme} onOpenAuth={openAuth} />
            <main>
                <Hero />
                <About />
                <ATSChecker isLoggedIn={!!user} onOpenAuth={openAuth} />
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
            <BackToTop />
            <Footer />
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialMode={authMode}
                onLoginSuccess={() => { }} // AuthContext handles state now
            />

        </div>
    );
}

export default LandingPage;

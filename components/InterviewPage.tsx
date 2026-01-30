import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import LiveInterview from './LiveInterview';
import { useAuth } from '../lib/AuthContext';

const InterviewPage: React.FC = () => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <div className="min-h-screen bg-navy-950 flex flex-col">
            <Navbar
                theme={theme}
                onToggleTheme={toggleTheme}
                onOpenAuth={() => { }}
            />
            <main className="flex-grow pt-20">
                <LiveInterview />
            </main>
            <Footer />
        </div>
    );
};

export default InterviewPage;

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ATSChecker from './ATSChecker';
import { useAuth } from '../lib/AuthContext';

const ScannerPage: React.FC = () => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar
                theme={theme}
                onToggleTheme={toggleTheme}
                onOpenAuth={() => { }} // No-op for logged in users
            />
            <main className="flex-grow pt-20">
                <ATSChecker isLoggedIn={!!user} onOpenAuth={() => { }} />
            </main>
            <Footer />
        </div>
    );
};

export default ScannerPage;

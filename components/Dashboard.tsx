
import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    // These props are needed for the Navbar but might not be fully functional 
    // without lifting state up to a common layout or Context. 
    // For now, we provide dummy handlers or basic implementations.
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar theme={theme} onToggleTheme={toggleTheme} onOpenAuth={() => { }} />

            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-3xl font-bold text-navy-900 mb-6">Account</h1>

                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 mb-8">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mr-4">
                                <i className="fas fa-user text-xl"></i>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Welcome back!</p>
                                <p className="text-lg font-bold text-navy-900">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-file-alt"></i>
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 mb-2">My Resumes</h3>
                            <p className="text-slate-600 text-sm mb-4">Manage and edit your saved resumes.</p>
                            <Link to="/resumes" className="text-brand-600 font-medium text-sm hover:underline">View Resumes &rarr;</Link>
                        </div>

                        <div className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-microphone-lines"></i>
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 mb-2">Interview Prep</h3>
                            <p className="text-slate-600 text-sm mb-4">Practice with our AI interviewer.</p>
                            <a href="/#interview" className="text-brand-600 font-medium text-sm hover:underline">Start Practice &rarr;</a>
                        </div>

                        <div className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-magnifying-glass-chart"></i>
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 mb-2">ATS Scanner</h3>
                            <p className="text-slate-600 text-sm mb-4">Check your resume score.</p>
                            <a href="/#ats-checker" className="text-brand-600 font-medium text-sm hover:underline">Scan Resume &rarr;</a>
                        </div>



                        <div className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-cog"></i>
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 mb-2">Settings</h3>
                            <p className="text-slate-600 text-sm mb-4">Update your profile and preferences.</p>
                            <Link to="/settings" className="text-brand-600 font-medium text-sm hover:underline">Manage Account &rarr;</Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;

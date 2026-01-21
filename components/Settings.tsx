
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Settings: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar theme="light" onToggleTheme={() => { }} onOpenAuth={() => { }} />
            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-3xl font-bold text-navy-900 mb-6">Account Settings</h1>
                    <div className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input type="email" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" value="user@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="Your Name" />
                        </div>
                        <button className="bg-navy-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-navy-800 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Settings;

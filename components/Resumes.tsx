import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Resumes: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar theme="light" onToggleTheme={() => { }} onOpenAuth={() => { }} />
            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-3xl font-bold text-navy-900 mb-6">My Resumes</h1>
                    <p className="text-slate-600">You don't have any saved resumes yet.</p>
                    <button
                        onClick={() => navigate('/#builder')}
                        className="mt-4 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
                    >
                        Create New Resume
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Resumes;

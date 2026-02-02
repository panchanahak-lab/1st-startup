import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CreditsCard from './CreditsCard';
import AIUsageStats from './AIUsageStats';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Settings: React.FC = () => {
    const { user, session } = useAuth();
    const [credits, setCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        fullName: '',
        email: ''
    });

    useEffect(() => {
        if (user?.id) {
            fetchUserData();
        }
    }, [user?.id]);

    const fetchUserData = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Fetch credits
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('ai_credits')
                .eq('user_id', user.id)
                .single();

            setCredits(subData?.ai_credits || 0);

            // Set profile from user
            setProfile({
                fullName: user.user_metadata?.full_name || '',
                email: user.email || ''
            });
        } catch (err) {
            console.error('Error fetching user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.fullName }
            });

            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col">
            <Navbar theme="light" onToggleTheme={() => { }} onOpenAuth={() => { }} />

            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
                <div className="max-w-6xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-navy-900 dark:text-white mb-2">
                            Account Settings
                        </h1>
                        <p className="text-slate-500">
                            Manage your profile, credits, and preferences
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile & Settings */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 p-6">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <i className="fas fa-user text-brand-500" />
                                    Profile Information
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            disabled
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-navy-950 text-slate-500 cursor-not-allowed"
                                            value={profile.email}
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            Email cannot be changed
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-navy-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Your Name"
                                            value={profile.fullName}
                                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        className="bg-navy-900 dark:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-800 dark:hover:bg-brand-600 transition-colors flex items-center gap-2"
                                    >
                                        <i className="fas fa-save" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* AI Usage Stats */}
                            <AIUsageStats isLoading={loading} />

                            {/* Preferences Card */}
                            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 p-6">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <i className="fas fa-cog text-brand-500" />
                                    Preferences
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5">
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-200">
                                                Email Notifications
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Receive updates about new features
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-200">
                                                Usage Tips
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Get tips to improve your resume
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Credits */}
                        <div className="space-y-6">
                            <CreditsCard credits={credits} isLoading={loading} />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Settings;

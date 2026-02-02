import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AI_CONFIG, AIFeature } from '../lib/aiConfig';
import { callGemini } from '../lib/geminiService';

interface UserData {
    id: string;
    email: string;
    credits: number;
}

interface UsageLog {
    id: string;
    user_id: string;
    feature: string;
    model: string;
    credits_used: number;
    is_admin: boolean;
    created_at: string;
}

const AdminPanel: React.FC = () => {
    const { user, session } = useAuth();
    const [activeTab, setActiveTab] = useState<'test' | 'analytics' | 'users'>('test');
    const [users, setUsers] = useState<UserData[]>([]);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Test Console State
    const [testFeature, setTestFeature] = useState<AIFeature>('resume_ai');
    const [testPrompt, setTestPrompt] = useState('Write a bullet point for a software engineer who improved system performance.');
    const [testResult, setTestResult] = useState('');
    const [testing, setTesting] = useState(false);

    // Credit Manager State
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [creditAmount, setCreditAmount] = useState<number>(10);
    const [creditAction, setCreditAction] = useState<'add' | 'set'>('add');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users with credits
            const { data: userData } = await supabase
                .from('subscriptions')
                .select('user_id, ai_credits');

            // Get user emails (this would normally need a separate admin query)
            const usersWithCredits = (userData || []).map((u: any) => ({
                id: u.user_id,
                email: u.user_id.substring(0, 8) + '...', // Truncated for display
                credits: u.ai_credits || 0
            }));
            setUsers(usersWithCredits);

            // Fetch recent usage logs
            const { data: logData } = await supabase
                .from('ai_usage_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            setLogs(logData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const runTest = async () => {
        if (!session?.access_token) return;

        setTesting(true);
        setTestResult('');

        try {
            const response = await callGemini({
                feature: testFeature,
                prompt: testPrompt,
                userId: user?.id || '',
                sessionToken: session.access_token
            });

            if (response.success) {
                setTestResult(response.data || 'No response');
            } else {
                setTestResult(`Error: ${response.error}`);
            }
        } catch (err: any) {
            setTestResult(`Error: ${err.message}`);
        } finally {
            setTesting(false);
        }
    };

    const handleCreditsUpdate = async () => {
        if (!selectedUser || !session?.access_token) return;

        try {
            const response = await fetch('/api/admin/add-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: selectedUser,
                    amount: creditAmount,
                    action: creditAction
                })
            });

            if (response.ok) {
                alert('Credits updated successfully!');
                fetchData();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    // Analytics calculations
    const analytics = {
        totalCalls: logs.length,
        flashCalls: logs.filter(l => l.model === 'flash').length,
        proCalls: logs.filter(l => l.model === 'pro').length,
        adminCalls: logs.filter(l => l.is_admin).length,
        byFeature: logs.reduce((acc: Record<string, number>, log) => {
            acc[log.feature] = (acc[log.feature] || 0) + 1;
            return acc;
        }, {})
    };

    return (
        <div className="min-h-screen bg-navy-950">
            <Navbar theme="dark" onToggleTheme={() => { }} onOpenAuth={() => { }} />

            <main className="container mx-auto px-4 py-8 pt-24">
                {/* Admin Badge */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        <i className="fas fa-shield-alt" />
                        ADMIN MODE
                    </div>
                    <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    {[
                        { id: 'test', label: 'Feature Test Console', icon: 'fa-flask' },
                        { id: 'analytics', label: 'AI Usage Analytics', icon: 'fa-chart-bar' },
                        { id: 'users', label: 'User Credit Manager', icon: 'fa-users' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === tab.id
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-navy-900 text-slate-400 hover:text-white'
                                }`}
                        >
                            <i className={`fas ${tab.icon}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-navy-900 rounded-2xl border border-white/10 p-6">
                    {/* Test Console */}
                    {activeTab === 'test' && (
                        <div className="space-y-6">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                                <i className="fas fa-info-circle mr-2" />
                                Admin Mode: AI calls will not deduct credits
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Feature</label>
                                    <select
                                        value={testFeature}
                                        onChange={(e) => setTestFeature(e.target.value as AIFeature)}
                                        className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-white"
                                    >
                                        {Object.entries(AI_CONFIG).map(([key, config]) => (
                                            <option key={key} value={key}>
                                                {key} ({config.model} - {config.cost} credits)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Test Prompt</label>
                                <textarea
                                    value={testPrompt}
                                    onChange={(e) => setTestPrompt(e.target.value)}
                                    className="w-full h-32 px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-white resize-none"
                                    placeholder="Enter your test prompt..."
                                />
                            </div>

                            <button
                                onClick={runTest}
                                disabled={testing}
                                className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-600 disabled:opacity-50"
                            >
                                {testing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-play" />
                                        Run Test
                                    </>
                                )}
                            </button>

                            {testResult && (
                                <div className="bg-navy-950 border border-white/10 rounded-xl p-4">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Result</p>
                                    <pre className="text-white text-sm whitespace-pre-wrap">{testResult}</pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-navy-950 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-brand-500">{analytics.totalCalls}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total Calls</p>
                                </div>
                                <div className="bg-navy-950 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-green-500">{analytics.flashCalls}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Flash Calls</p>
                                </div>
                                <div className="bg-navy-950 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-purple-500">{analytics.proCalls}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Pro Calls</p>
                                </div>
                                <div className="bg-navy-950 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-red-500">{analytics.adminCalls}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Admin Calls</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">Usage by Feature</h3>
                                <div className="space-y-2">
                                    {Object.entries(analytics.byFeature).map(([feature, count]) => (
                                        <div key={feature} className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-slate-300">{feature}</span>
                                            <span className="font-bold text-white">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">Recent Logs</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-400 text-left">
                                                <th className="pb-2">Feature</th>
                                                <th className="pb-2">Model</th>
                                                <th className="pb-2">Credits</th>
                                                <th className="pb-2">Admin</th>
                                                <th className="pb-2">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.slice(0, 20).map((log) => (
                                                <tr key={log.id} className="border-t border-white/5 text-slate-300">
                                                    <td className="py-2">{log.feature}</td>
                                                    <td className="py-2">{log.model}</td>
                                                    <td className="py-2">{log.credits_used}</td>
                                                    <td className="py-2">
                                                        {log.is_admin && <span className="text-red-400">Yes</span>}
                                                    </td>
                                                    <td className="py-2">{new Date(log.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Credit Manager */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Select User</label>
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-white"
                                    >
                                        <option value="">Select a user...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.email} ({u.credits} credits)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Action</label>
                                    <select
                                        value={creditAction}
                                        onChange={(e) => setCreditAction(e.target.value as 'add' | 'set')}
                                        className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-white"
                                    >
                                        <option value="add">Add Credits</option>
                                        <option value="set">Set Credits To</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Amount</label>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-white"
                                        min={0}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreditsUpdate}
                                disabled={!selectedUser}
                                className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-600 disabled:opacity-50"
                            >
                                <i className="fas fa-coins" />
                                Update Credits
                            </button>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">All Users</h3>
                                <div className="space-y-2">
                                    {users.map(u => (
                                        <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-slate-300 font-mono text-sm">{u.id}</span>
                                            <span className="font-bold text-brand-500">{u.credits} credits</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;

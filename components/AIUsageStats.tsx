import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface UsageStats {
    totalCalls: number;
    byFeature: Record<string, number>;
    lastUsed: string | null;
}

interface AIUsageStatsProps {
    isLoading?: boolean;
}

const AIUsageStats: React.FC<AIUsageStatsProps> = ({ isLoading: externalLoading }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchStats();
        }
    }, [user?.id]);

    const fetchStats = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Fetch usage logs for this user
            const { data, error } = await supabase
                .from('ai_usage_logs')
                .select('feature, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching usage stats:', error);
                // Set default stats if table doesn't exist yet
                setStats({
                    totalCalls: 0,
                    byFeature: {},
                    lastUsed: null
                });
                return;
            }

            // Calculate stats
            const byFeature: Record<string, number> = {};
            (data || []).forEach((log: any) => {
                byFeature[log.feature] = (byFeature[log.feature] || 0) + 1;
            });

            setStats({
                totalCalls: data?.length || 0,
                byFeature,
                lastUsed: data?.[0]?.created_at || null
            });
        } catch (err) {
            console.error('Stats fetch error:', err);
            setStats({
                totalCalls: 0,
                byFeature: {},
                lastUsed: null
            });
        } finally {
            setLoading(false);
        }
    };

    const featureLabels: Record<string, { name: string; icon: string; color: string }> = {
        resume_ai: { name: 'Resume AI', icon: 'fa-file-alt', color: 'bg-blue-100 text-blue-600' },
        interview_ai: { name: 'Interview AI', icon: 'fa-microphone', color: 'bg-green-100 text-green-600' },
        linkedin_ai: { name: 'LinkedIn AI', icon: 'fa-linkedin', color: 'bg-purple-100 text-purple-600' },
        summary_ai: { name: 'Summary AI', icon: 'fa-align-left', color: 'bg-amber-100 text-amber-600' },
        chatbot_ai: { name: 'Chat AI', icon: 'fa-comment', color: 'bg-pink-100 text-pink-600' },
        ats_ai: { name: 'ATS AI', icon: 'fa-chart-line', color: 'bg-cyan-100 text-cyan-600' }
    };

    const isLoading = externalLoading || loading;

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fas fa-chart-bar text-brand-500" />
                    AI Usage Statistics
                </h3>
            </div>

            {/* Stats Overview */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-brand-500">{stats?.totalCalls || 0}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                            Total AI Actions
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 text-center">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {stats?.lastUsed
                                ? new Date(stats.lastUsed).toLocaleDateString()
                                : 'Never'}
                        </p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                            Last Used
                        </p>
                    </div>
                </div>

                {/* Feature Breakdown */}
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Usage by Feature
                </h4>

                {stats && Object.keys(stats.byFeature).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(stats.byFeature).map(([feature, count]) => {
                            const info = featureLabels[feature] || {
                                name: feature,
                                icon: 'fa-cog',
                                color: 'bg-slate-100 text-slate-600'
                            };
                            const percentage = Math.round((count / stats.totalCalls) * 100);

                            return (
                                <div key={feature} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${info.color}`}>
                                                <i className={`fas ${info.icon} text-xs`} />
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {info.name}
                                            </span>
                                        </div>
                                        <span className="text-slate-500">{count} uses</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <i className="fas fa-inbox text-3xl mb-3 opacity-50" />
                        <p className="text-sm">No AI usage yet</p>
                        <p className="text-xs mt-1">Your usage stats will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIUsageStats;

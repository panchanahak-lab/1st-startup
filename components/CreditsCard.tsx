import React from 'react';
import { CREDIT_COSTS, FREE_CREDITS } from '../lib/aiConfig';

interface CreditsCardProps {
    credits: number;
    isLoading?: boolean;
}

const CreditsCard: React.FC<CreditsCardProps> = ({ credits, isLoading }) => {
    const creditItems = [
        { name: 'Resume AI Improvement', cost: CREDIT_COSTS.RESUME_AI, icon: 'fa-file-alt' },
        { name: 'Interview AI Feedback', cost: CREDIT_COSTS.INTERVIEW_AI, icon: 'fa-microphone' },
        { name: 'LinkedIn Optimization', cost: CREDIT_COSTS.LINKEDIN_AI, icon: 'fa-linkedin', premium: true },
        { name: 'AI Summary', cost: CREDIT_COSTS.SUMMARY_AI, icon: 'fa-align-left' },
        { name: 'PDF Export', cost: CREDIT_COSTS.PDF_EXPORT, icon: 'fa-file-pdf', free: true },
    ];

    return (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                            Available Credits
                        </h3>
                        {isLoading ? (
                            <div className="h-10 w-20 bg-white/20 rounded animate-pulse" />
                        ) : (
                            <p className="text-4xl font-black">{credits}</p>
                        )}
                    </div>
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-coins text-2xl" />
                    </div>
                </div>
            </div>

            {/* Credit Costs */}
            <div className="p-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Feature Costs
                </h4>
                <div className="space-y-3">
                    {creditItems.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.free ? 'bg-green-100 text-green-600' :
                                        item.premium ? 'bg-purple-100 text-purple-600' :
                                            'bg-brand-100 text-brand-600'
                                    }`}>
                                    <i className={`fas ${item.icon} text-sm`} />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {item.name}
                                </span>
                            </div>
                            <span className={`text-sm font-black ${item.free ? 'text-green-600' :
                                    item.premium ? 'text-purple-600' : 'text-slate-600 dark:text-slate-300'
                                }`}>
                                {item.free ? 'FREE' : `${item.cost} credit${item.cost > 1 ? 's' : ''}`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Earn Credits */}
            <div className="bg-slate-50 dark:bg-navy-950 p-6 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Earn Free Credits
                </h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <i className="fas fa-gift text-green-500" />
                        <span>Sign up bonus: <strong>{FREE_CREDITS.SIGNUP_BONUS} credits</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <i className="fas fa-calendar-check text-blue-500" />
                        <span>Daily login: <strong>{FREE_CREDITS.DAILY_LOGIN} credit</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <i className="fas fa-comment text-purple-500" />
                        <span>Submit feedback: <strong>{FREE_CREDITS.FEEDBACK_SUBMISSION} credit</strong></span>
                    </div>
                </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10">
                <div className="bg-gradient-to-r from-brand-500/10 to-purple-500/10 rounded-xl p-4 border border-brand-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <i className="fas fa-rocket text-brand-500" />
                        <span className="font-bold text-slate-800 dark:text-white">Premium Coming Soon</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Early users get exclusive benefits and bonus credits when we launch!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreditsCard;

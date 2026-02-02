// AI Configuration - Centralized settings for all AI features
// Controls model selection, credit costs, and input limits

export type AIFeature =
    | 'resume_ai'
    | 'interview_ai'
    | 'linkedin_ai'
    | 'summary_ai'
    | 'chatbot_ai'
    | 'ats_ai';

export type AIModel = 'flash' | 'pro';

export interface FeatureConfig {
    model: AIModel;
    cost: number;
    maxInputChars: number;
    description: string;
}

export const AI_CONFIG: Record<AIFeature, FeatureConfig> = {
    resume_ai: {
        model: 'flash',
        cost: 1,
        maxInputChars: 5000,
        description: 'Resume improvements and bullet point enhancement'
    },
    interview_ai: {
        model: 'flash',
        cost: 1,
        maxInputChars: 10000,
        description: 'Post-interview feedback and analysis'
    },
    linkedin_ai: {
        model: 'pro',
        cost: 4,
        maxInputChars: 3000,
        description: 'LinkedIn profile optimization (Premium)'
    },
    summary_ai: {
        model: 'flash',
        cost: 1,
        maxInputChars: 5000,
        description: 'AI-powered content summarization'
    },
    chatbot_ai: {
        model: 'flash',
        cost: 1,
        maxInputChars: 2000,
        description: 'Career assistant responses'
    },
    ats_ai: {
        model: 'flash',
        cost: 1,
        maxInputChars: 5000,
        description: 'ATS score improvement suggestions'
    }
} as const;

export const MODEL_IDS: Record<AIModel, string> = {
    flash: 'gemini-2.5-flash',
    pro: 'gemini-1.5-pro'
} as const;

// Feature-wise credit costs for UI display
export const CREDIT_COSTS = {
    RESUME_AI: AI_CONFIG.resume_ai.cost,
    ATS_AI: AI_CONFIG.ats_ai.cost,
    INTERVIEW_AI: AI_CONFIG.interview_ai.cost,
    LINKEDIN_AI: AI_CONFIG.linkedin_ai.cost,
    SUMMARY_AI: AI_CONFIG.summary_ai.cost,
    CHATBOT_AI: AI_CONFIG.chatbot_ai.cost,
    PDF_EXPORT: 0, // Always free
} as const;

// Free credit rewards
export const FREE_CREDITS = {
    SIGNUP_BONUS: 3,
    DAILY_LOGIN: 1,
    FEEDBACK_SUBMISSION: 1,
} as const;

// Hash function for caching
export function hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

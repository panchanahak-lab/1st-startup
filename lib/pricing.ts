// Pricing configuration for the application
// Updated to use new AI optimization credit structure

export const PLANS = {
    starter: {
        name: "Starter",
        price: 49,
        credits: 10
    },
    popular: {
        name: "Job Ready",
        price: 99,
        credits: 25
    },
    pro: {
        name: "Pro",
        price: 199,
        credits: 60
    }
};

export type PlanId = keyof typeof PLANS;

// Credit costs for different features
// Updated with new optimized pricing from aiConfig.ts
export const CREDIT_COSTS = {
    // AI-Powered Features
    RESUME_AI: 1,          // Resume bullet enhancement (Flash)
    ATS_AI: 1,             // ATS improvement suggestions (Flash)
    INTERVIEW_AI: 1,       // Post-interview feedback (Flash)
    LINKEDIN_AI: 4,        // LinkedIn optimization (Pro)
    SUMMARY_AI: 1,         // AI summary generation (Flash)
    CHATBOT_AI: 1,         // Chatbot AI fallback (Flash)

    // Free Features
    PDF_EXPORT: 0,         // Always free
    ATS_CHECK: 0,          // Logic-based scoring is free

    // Legacy names (for backward compatibility)
    AI_BULLET_ENHANCE: 1,
    AI_SUMMARY_GENERATE: 1,
    AI_FEEDBACK: 1,
    INTERVIEW_PREP: 1      // Reduced from 5 (now uses static questions + AI feedback)
} as const;

export function getPlanById(planId: string) {
    return PLANS[planId as PlanId] ?? null;
}

export function calculateCreditsForAmount(amountInINR: number): number {
    if (amountInINR >= 199) return 60;
    if (amountInINR >= 99) return 25;
    if (amountInINR >= 49) return 10;
    return 0;
}

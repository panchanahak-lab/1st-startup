// Pricing configuration for the application

export const PLANS = {
    starter: {
        name: "Starter",
        price: 49,
        credits: 3
    },
    popular: {
        name: "Job Ready",
        price: 99,
        credits: 10
    },
    pro: {
        name: "Pro",
        price: 199,
        credits: 25
    }
};

export type PlanId = keyof typeof PLANS;

// Credit costs for different features
export const CREDIT_COSTS = {
    AI_BULLET_ENHANCE: 1,
    AI_SUMMARY_GENERATE: 2,
    AI_FEEDBACK: 3,
    PDF_EXPORT: 0, // Free
    ATS_CHECK: 1,
    INTERVIEW_PREP: 5
} as const;

export function getPlanById(planId: string) {
    return PLANS[planId as PlanId] ?? null;
}

export function calculateCreditsForAmount(amountInINR: number): number {
    // Find the best matching plan for the amount
    if (amountInINR >= 199) return 25;
    if (amountInINR >= 99) return 10;
    if (amountInINR >= 49) return 3;
    return 0;
}

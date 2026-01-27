// Pricing configuration for the application

export interface PricingPlan {
    id: string;
    name: string;
    price: number; // in INR
    credits: number;
    features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        credits: 10,
        features: [
            'Basic resume builder',
            '10 AI enhancements',
            'PDF export',
            'ATS checker'
        ]
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 199,
        credits: 100,
        features: [
            'Everything in Free',
            '100 AI enhancements',
            'Priority support',
            'Advanced templates'
        ]
    },
    {
        id: 'pro',
        name: 'Professional',
        price: 499,
        credits: 500,
        features: [
            'Everything in Starter',
            '500 AI enhancements',
            'LinkedIn optimizer',
            'Interview prep',
            'Custom branding'
        ]
    }
];

// Credit costs for different features
export const CREDIT_COSTS = {
    AI_BULLET_ENHANCE: 1,
    AI_SUMMARY_GENERATE: 2,
    AI_FEEDBACK: 3,
    PDF_EXPORT: 0, // Free
    ATS_CHECK: 1,
    INTERVIEW_PREP: 5
} as const;

export function getPlanById(planId: string): PricingPlan | undefined {
    return PRICING_PLANS.find(plan => plan.id === planId);
}

export function calculateCreditsForAmount(amountInINR: number): number {
    // Simple calculation: 1 credit per 2 INR
    return Math.floor(amountInINR / 2);
}

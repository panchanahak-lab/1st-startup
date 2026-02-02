// Centralized Gemini Service
// All AI calls MUST go through this service for:
// - Credit checking/deduction
// - Admin bypass
// - Usage logging
// - Response caching

import { AIFeature, AI_CONFIG, MODEL_IDS, hashContent } from './aiConfig';
import { supabase } from './supabaseClient';

export interface AICallOptions {
    feature: AIFeature;
    prompt: string;
    context?: string;
    userId: string;
    sessionToken: string;
    skipCache?: boolean;
}

export interface AIResponse {
    success: boolean;
    data?: string;
    error?: string;
    cached?: boolean;
    creditsUsed?: number;
}

export interface CreditCheckResult {
    hasCredits: boolean;
    isAdmin: boolean;
    currentCredits: number;
    requiredCredits: number;
}

/**
 * Main function to call Gemini API through the centralized service
 * This handles all credit checking, admin bypass, and logging
 */
export async function callGemini(options: AICallOptions): Promise<AIResponse> {
    const { feature, prompt, context, userId, sessionToken, skipCache } = options;
    const config = AI_CONFIG[feature];

    // Enforce input character limits
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    if (fullPrompt.length > config.maxInputChars) {
        return {
            success: false,
            error: `Input too long. Maximum ${config.maxInputChars} characters allowed.`
        };
    }

    try {
        const response = await fetch('/api/gemini-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                feature,
                prompt,
                context,
                skipCache
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific error codes
            if (response.status === 403) {
                return {
                    success: false,
                    error: 'NO_CREDITS',
                    creditsUsed: 0
                };
            }
            if (response.status === 402) {
                return {
                    success: false,
                    error: 'INSUFFICIENT_CREDITS',
                    creditsUsed: 0
                };
            }

            return {
                success: false,
                error: errorData.error || `Request failed with status ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data.result,
            cached: data.cached || false,
            creditsUsed: data.creditsUsed || 0
        };

    } catch (error: any) {
        console.error('Gemini service error:', error);
        return {
            success: false,
            error: error.message || 'Network error calling AI service'
        };
    }
}

/**
 * Check if user has enough credits for a feature (client-side check)
 */
export async function checkCredits(
    userId: string,
    feature: AIFeature,
    sessionToken: string
): Promise<CreditCheckResult> {
    const config = AI_CONFIG[feature];

    try {
        const response = await fetch('/api/check-credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ cost: config.cost })
        });

        const data = await response.json();

        if (response.status === 200) {
            return {
                hasCredits: true,
                isAdmin: data.isAdmin || false,
                currentCredits: data.remaining,
                requiredCredits: config.cost
            };
        }

        return {
            hasCredits: false,
            isAdmin: false,
            currentCredits: data.currentCredits || 0,
            requiredCredits: config.cost
        };

    } catch (error) {
        console.error('Credit check error:', error);
        return {
            hasCredits: false,
            isAdmin: false,
            currentCredits: 0,
            requiredCredits: config.cost
        };
    }
}

/**
 * Get feature configuration for UI display
 */
export function getFeatureConfig(feature: AIFeature) {
    return AI_CONFIG[feature];
}

/**
 * Get model display name (never expose actual model to user)
 */
export function getModelDisplayName(model: 'flash' | 'pro'): string {
    return model === 'pro' ? 'Advanced AI' : 'Smart AI';
}

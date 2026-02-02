import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Admin Client ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    : null;

// --- Feature Configuration (must match lib/aiConfig.ts) ---
type AIFeature = 'resume_ai' | 'interview_ai' | 'linkedin_ai' | 'summary_ai' | 'chatbot_ai' | 'ats_ai';
type AIModel = 'flash' | 'pro';

const AI_CONFIG: Record<AIFeature, { model: AIModel; cost: number; maxInputChars: number }> = {
    resume_ai: { model: 'flash', cost: 1, maxInputChars: 5000 },
    interview_ai: { model: 'flash', cost: 1, maxInputChars: 10000 },
    linkedin_ai: { model: 'pro', cost: 4, maxInputChars: 3000 },
    summary_ai: { model: 'flash', cost: 1, maxInputChars: 5000 },
    chatbot_ai: { model: 'flash', cost: 1, maxInputChars: 2000 },
    ats_ai: { model: 'flash', cost: 1, maxInputChars: 5000 }
};

const MODEL_IDS: Record<AIModel, string> = {
    flash: 'gemini-2.5-flash',
    pro: 'gemini-1.5-pro'
};

// --- Helper Functions ---
async function getUserFromToken(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '');
    if (!supabaseAdmin) return null;
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

async function checkIsAdmin(userId: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { data } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
    return data?.role === 'admin';
}

async function getUserCredits(userId: string): Promise<number> {
    if (!supabaseAdmin) return 0;
    const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('ai_credits')
        .eq('user_id', userId)
        .single();
    return data?.ai_credits || 0;
}

async function deductCredits(userId: string, amount: number): Promise<void> {
    if (!supabaseAdmin) return;
    const currentCredits = await getUserCredits(userId);
    await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: userId,
            ai_credits: Math.max(0, currentCredits - amount)
        });
}

async function logUsage(
    userId: string,
    feature: AIFeature,
    model: AIModel,
    creditsUsed: number,
    inputChars: number,
    outputChars: number,
    cached: boolean,
    isAdmin: boolean
): Promise<void> {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('ai_usage_logs').insert({
        user_id: userId,
        feature,
        model,
        credits_used: creditsUsed,
        input_chars: inputChars,
        output_chars: outputChars,
        cached,
        is_admin: isAdmin
    });
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Authenticate user
        const user = await getUserFromToken(req.headers.authorization || null);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // 2. Validate input
        const { feature, prompt, context, skipCache } = req.body;

        if (!feature || !AI_CONFIG[feature as AIFeature]) {
            return res.status(400).json({ error: 'Invalid feature' });
        }
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const config = AI_CONFIG[feature as AIFeature];
        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

        // 3. Enforce character limits
        if (fullPrompt.length > config.maxInputChars) {
            return res.status(400).json({
                error: `Input too long. Maximum ${config.maxInputChars} characters.`
            });
        }

        // 4. Check if admin (bypass credits)
        const isAdmin = await checkIsAdmin(user.id);

        // 5. Check credits (skip for admins)
        if (!isAdmin) {
            const userCredits = await getUserCredits(user.id);

            if (userCredits <= 0) {
                return res.status(403).json({
                    error: 'NO_CREDITS',
                    message: 'You have 0 credits. Please upgrade to continue.'
                });
            }

            if (userCredits < config.cost) {
                return res.status(402).json({
                    error: 'INSUFFICIENT_CREDITS',
                    message: `This action requires ${config.cost} credits, but you have ${userCredits}.`
                });
            }
        }

        // 6. Call Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'AI service not configured' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelId = MODEL_IDS[config.model];
        const model = genAI.getGenerativeModel({ model: modelId });

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text().trim();

        // 7. Deduct credits (skip for admins)
        if (!isAdmin) {
            await deductCredits(user.id, config.cost);
        }

        // 8. Log usage (always log, even for admins)
        await logUsage(
            user.id,
            feature as AIFeature,
            config.model,
            isAdmin ? 0 : config.cost,
            fullPrompt.length,
            responseText.length,
            false, // cached
            isAdmin
        );

        // 9. Return response
        return res.status(200).json({
            success: true,
            result: responseText,
            creditsUsed: isAdmin ? 0 : config.cost,
            cached: false
        });

    } catch (error: any) {
        console.error('Gemini API error:', error);

        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Invalid API key configuration' });
        }
        if (error.message?.includes('quota')) {
            return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
        }

        return res.status(500).json({
            error: 'Failed to generate AI response',
            details: error.message
        });
    }
}

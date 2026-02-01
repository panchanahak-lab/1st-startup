import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getUserFromToken } from '../lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS handling
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await getUserFromToken(req.headers.authorization || null);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Ignored req.body.userId -> Using authenticated user.id instead

        const { data } = await supabaseAdmin
            .from("subscriptions")
            .select("ai_credits")
            .eq("user_id", user.id)
            .single();

        if (!data || data.ai_credits <= 0) {
            return res.status(402).json({
                locked: true,
                message: "AI Interview is a premium feature"
            });
        }

        return res.status(200).json({
            feedback: "Premium access granted"
        });

    } catch (error: any) {
        console.error('Check interview access error:', error);
        return res.status(500).json({
            error: error.message || "Unknown error",
            details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            stack: error.stack,
            envCheck: {
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasUrl: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL
            }
        });
    }
}

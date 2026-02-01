import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getUserFromToken } from "./_shared";

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

        const { cost = 1 } = req.body;
        // Ignored req.body.userId -> Using authenticated user.id instead

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Server misconfigured: Missing Supabase Admin Key' });
        }

        const { data } = await supabaseAdmin
            .from("subscriptions")
            .select("ai_credits")
            .eq("user_id", user.id)
            .single();

        const userCredits = data?.ai_credits || 0;

        if (userCredits <= 0) {
            return res.status(403).json({
                error: "NO_CREDITS",
                message: "You have 0 credits. Please upgrade or wait for daily reset."
            });
        }

        if (userCredits < cost) {
            return res.status(402).json({
                error: "INSUFFICIENT_CREDITS",
                message: `This action requires ${cost} credits, but you only have ${userCredits}.`
            });
        }

        return res.status(200).json({ success: true, remaining: userCredits });

    } catch (error: any) {
        console.error('Check credits error:', error);
        return res.status(500).json({ error: error.message });
    }
}

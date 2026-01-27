import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseServer';

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
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const { data } = await supabaseAdmin
            .from("subscriptions")
            .select("ai_credits")
            .eq("user_id", userId)
            .single();

        if (!data || data.ai_credits <= 0) {
            return res.status(402).json({
                locked: true,
                message: "Premium feature – coming soon"
            });
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Check credits error:', error);
        return res.status(500).json({ error: error.message });
    }
}

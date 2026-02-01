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

        const { credits } = req.body;

        if (credits === undefined) {
            return res.status(400).json({ error: 'Missing credits' });
        }

        // SECURITY WARNING: This endpoint allows setting arbitrary credits.
        // In a real production app, you should verify a secret header here.
        // e.g. if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) return res.status(401)...

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Server misconfigured: Missing Supabase Admin Key' });
        }

        const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({ ai_credits: credits })
            .eq("user_id", user.id);

        if (error) throw error;

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Update credits error:', error);
        return res.status(500).json({ error: error.message });
    }
}

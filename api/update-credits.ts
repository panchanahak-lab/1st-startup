import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// --- Inlined Shared Logic ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    : null;

async function getUserFromToken(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '');
    if (!supabaseAdmin) return null;
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}
// ----------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const user = await getUserFromToken(req.headers.authorization || null);
        if (!user) return res.status(401).json({ error: 'Not authenticated' });

        const { credits } = req.body;
        if (credits === undefined) return res.status(400).json({ error: 'Missing credits' });

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

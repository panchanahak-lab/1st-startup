import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

async function checkIsAdmin(userId: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { data } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
    return data?.role === 'admin';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Authenticate
        const user = await getUserFromToken(req.headers.authorization || null);
        if (!user) return res.status(401).json({ error: 'Not authenticated' });

        // 2. Check if requester is admin
        const isAdmin = await checkIsAdmin(user.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // 3. Get request body
        const { userId, amount, action = 'add' } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        if (typeof amount !== 'number') {
            return res.status(400).json({ error: 'amount must be a number' });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Server misconfigured' });
        }

        // 4. Get current credits
        const { data: currentData } = await supabaseAdmin
            .from('subscriptions')
            .select('ai_credits')
            .eq('user_id', userId)
            .single();

        const currentCredits = currentData?.ai_credits || 0;

        // 5. Calculate new credits
        let newCredits: number;
        if (action === 'set') {
            newCredits = Math.max(0, amount);
        } else {
            // add
            newCredits = Math.max(0, currentCredits + amount);
        }

        // 6. Update or insert
        const { error: upsertError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                ai_credits: newCredits
            });

        if (upsertError) {
            console.error('Error updating credits:', upsertError);
            return res.status(500).json({ error: 'Failed to update credits' });
        }

        return res.status(200).json({
            success: true,
            previousCredits: currentCredits,
            newCredits,
            action
        });

    } catch (error: any) {
        console.error('Admin add credits error:', error);
        return res.status(500).json({ error: error.message });
    }
}

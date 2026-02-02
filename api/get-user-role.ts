import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Admin Client ---
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

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Server misconfigured: Missing Supabase Admin Key' });
        }

        // Check if user is admin
        const isAdmin = await checkIsAdmin(user.id);

        // Get user role for response
        const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        return res.status(200).json({
            success: true,
            role: roleData?.role || 'user',
            isAdmin
        });

    } catch (error: any) {
        console.error('Get user role error:', error);
        return res.status(500).json({ error: error.message });
    }
}

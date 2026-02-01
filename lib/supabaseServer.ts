import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service role key
// This should ONLY be used in API routes, never in client-side code

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.warn('Warning: SUPABASE_URL is not set');
}

if (!supabaseServiceKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations will fail.');
}

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null;

// Helper to get user from Authorization header
export async function getUserFromToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseAdmin) {
    console.error('Supabase Admin client not initialized');
    return null;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

import { Session } from '@supabase/supabase-js';

export class ToolAccessError extends Error {
    code: 'NO_CREDITS' | 'INSUFFICIENT_CREDITS' | 'GENERIC';

    constructor(message: string, code: 'NO_CREDITS' | 'INSUFFICIENT_CREDITS' | 'GENERIC' = 'GENERIC') {
        super(message);
        this.name = 'ToolAccessError';
        this.code = code;
    }
}

export const verifyCredits = async (session: Session | null, cost: number = 1): Promise<void> => {
    // Bypass credit checks to allow access to all features without logging in
    return;
};


import { User } from '@supabase/supabase-js';

export class ToolAccessError extends Error {
    code: 'NO_CREDITS' | 'INSUFFICIENT_CREDITS' | 'GENERIC';

    constructor(message: string, code: 'NO_CREDITS' | 'INSUFFICIENT_CREDITS' | 'GENERIC' = 'GENERIC') {
        super(message);
        this.name = 'ToolAccessError';
        this.code = code;
    }
}

export const verifyCredits = async (user: User | null, cost: number = 1): Promise<void> => {
    if (!user) {
        // Optionally handle not logged in case here or let caller handle it
        throw new ToolAccessError("Please sign in to use this feature.", 'GENERIC');
    }

    try {
        const res = await fetch('/api/check-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, cost })
        });

        if (!res.ok) {
            let data;
            try {
                data = await res.json();
            } catch (e) {
                // If response is not JSON (e.g., 500 HTML page), throw generic error
                throw new ToolAccessError(`Server Error (${res.status}): ${res.statusText}`, 'GENERIC');
            }

            const code = res.status === 403 ? 'NO_CREDITS' :
                res.status === 402 ? 'INSUFFICIENT_CREDITS' : 'GENERIC';
            throw new ToolAccessError(data.message || "Failed to verify credits", code);
        }
    } catch (error: any) {
        if (error instanceof ToolAccessError) throw error;
        throw new ToolAccessError(error.message || "Network error checking credits", 'GENERIC');
    }
};

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
    if (!session || !session.user) {
        // Optionally handle not logged in case here or let caller handle it
        throw new ToolAccessError("Please sign in to use this feature.", 'GENERIC');
    }

    try {
        const res = await fetch('/api/check-credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ cost }) // userId is now inferred from token
        });

        if (!res.ok) {
            let data;
            try {
                data = await res.json();
            } catch (e) {
                // Response is not JSON (likely 500 HTML from Vercel crash)
                const text = await res.text();
                console.error("Non-JSON API Response:", text);
                const match = text.match(/<pre>(.*?)<\/pre>/s) || text.match(/<title>(.*?)<\/title>/);
                const errorSnippet = match ? match[1] : text.substring(0, 100);
                throw new ToolAccessError(`Server Error (${res.status}): ${errorSnippet}`, 'GENERIC');
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

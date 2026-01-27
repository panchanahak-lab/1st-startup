import { supabaseAdmin, getUserFromToken } from './supabaseServer';

export interface UserCredits {
    user_id: string;
    balance: number;
    updated_at: string;
}

// Get user's current credit balance
export async function getCredits(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

    if (error) {
        // If no record exists, return default credits for new users
        if (error.code === 'PGRST116') {
            return 10; // Default credits for new users
        }
        console.error('Error fetching credits:', error);
        return 0;
    }

    return data?.balance ?? 0;
}

// Deduct credits from user's balance
export async function deductCredits(userId: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const currentBalance = await getCredits(userId);

    if (currentBalance < amount) {
        return {
            success: false,
            newBalance: currentBalance,
            error: 'Insufficient credits'
        };
    }

    const newBalance = currentBalance - amount;

    const { error } = await supabaseAdmin
        .from('user_credits')
        .upsert({
            user_id: userId,
            balance: newBalance,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        console.error('Error deducting credits:', error);
        return {
            success: false,
            newBalance: currentBalance,
            error: 'Failed to deduct credits'
        };
    }

    return {
        success: true,
        newBalance
    };
}

// Add credits to user's balance
export async function addCredits(userId: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const currentBalance = await getCredits(userId);
    const newBalance = currentBalance + amount;

    const { error } = await supabaseAdmin
        .from('user_credits')
        .upsert({
            user_id: userId,
            balance: newBalance,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        console.error('Error adding credits:', error);
        return {
            success: false,
            newBalance: currentBalance,
            error: 'Failed to add credits'
        };
    }

    return {
        success: true,
        newBalance
    };
}

// Check if user has enough credits for an operation
export async function hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await getCredits(userId);
    return balance >= requiredCredits;
}

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AdminCheckResult {
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
}

export function useAdminCheck(): AdminCheckResult {
    const { session } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.access_token) {
            checkAdminStatus();
        } else {
            setLoading(false);
            setIsAdmin(false);
        }
    }, [session?.access_token]);

    const checkAdminStatus = async () => {
        if (!session?.access_token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/get-user-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check admin status');
            }

            const data = await response.json();
            setIsAdmin(data.isAdmin || false);
            setError(null);
        } catch (err: any) {
            console.error('Admin check error:', err);
            setError(err.message);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    return { isAdmin, loading, error };
}

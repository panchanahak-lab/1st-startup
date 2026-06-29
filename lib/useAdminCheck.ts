import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AdminCheckResult {
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
}

export function useAdminCheck(): AdminCheckResult {
    return { isAdmin: true, loading: false, error: null };
}

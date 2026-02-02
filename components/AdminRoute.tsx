import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useAdminCheck } from '../lib/useAdminCheck';

const AdminRoute: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdminCheck();

    // Show loading while checking auth and admin status
    if (authLoading || adminLoading) {
        return (
            <div className="min-h-screen bg-navy-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Not admin
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    // Admin - show protected content
    return <Outlet />;
};

export default AdminRoute;

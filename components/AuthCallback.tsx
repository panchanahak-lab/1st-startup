import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function AuthCallback() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If user is detected (AuthContext caught the session), redirect to dashboard
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    useEffect(() => {
        // Safety timeout: If after 4 seconds we still haven't redirected (no user found), 
        // fallback to home page to prevent infinite hanging.
        const timer = setTimeout(() => {
            console.warn("Auth callback timeout - redirecting to home");
            navigate("/");
        }, 4000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center animate-pulse">
                <h2 className="text-xl font-bold text-navy-900 mb-2">Signing you in...</h2>
                <p className="text-slate-500">Please wait a moment.</p>
            </div>
        </div>
    );
}

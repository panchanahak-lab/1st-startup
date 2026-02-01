import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Check if AuthContext already has the user
        if (user) {
            console.log("AuthCallback: User found in context, redirecting to dashboard");
            navigate("/dashboard");
            return;
        }

        const handleAuth = async () => {
            console.log("AuthCallback: Checking session...");

            // 2. Explicitly check session from Supabase client
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("AuthCallback error:", error);
                navigate("/");
                return;
            }

            if (session) {
                console.log("AuthCallback: Session found explicitly, redirecting...");
                navigate("/dashboard");
            } else {
                console.log("AuthCallback: No session found yet, waiting for listener...");
            }
        };

        handleAuth();

        // 3. Safety timeout - if nothing happens within 5 seconds
        const timer = setTimeout(() => {
            console.warn("AuthCallback: Timeout reached. Redirecting to home.");
            navigate("/");
        }, 5000);

        return () => clearTimeout(timer);
    }, [user, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-navy-900 mb-2">Finalizing Sign In...</h2>
                <p className="text-slate-500">Just a moment while we set up your account.</p>
            </div>
        </div>
    );
}

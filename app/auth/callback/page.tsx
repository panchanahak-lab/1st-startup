import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

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

            if (session) {
                console.log("AuthCallback: Session found explicitly, redirecting...");
                navigate("/dashboard");
                return;
            }

            // 3. Fallback: Manually parse hash if Supabase detection failed
            const hash = window.location.hash;
            if (hash && hash.includes("access_token")) {
                console.log("AuthCallback: Found access_token in hash, attempting manual set...");
                try {
                    // Simple parser for hash fragment
                    const params = new URLSearchParams(hash.substring(1)); // remove leading #
                    const accessToken = params.get("access_token");
                    const refreshToken = params.get("refresh_token");

                    if (accessToken && refreshToken) {
                        const { data, error: setSessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (!setSessionError && data.session) {
                            console.log("AuthCallback: Session set manually success!");
                            navigate("/dashboard");
                            return;
                        } else {
                            console.error("AuthCallback: Manual session set failed", setSessionError);
                        }
                    }
                } catch (e) {
                    console.error("AuthCallback: Error parsing hash", e);
                }
            } else if (error) {
                console.error("AuthCallback error:", error);
            }
        };

        handleAuth();

        // 4. Safety timeout - if nothing happens within 8 seconds
        const timer = setTimeout(() => {
            console.warn("AuthCallback: Timeout reached. Redirecting to home.");
            navigate("/");
        }, 8000);

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

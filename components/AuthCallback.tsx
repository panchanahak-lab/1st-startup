import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check for hash parameters from OAuth redirect
        const handleAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Auth callback error:", error);
                navigate("/");
                return;
            }

            if (session) {
                navigate("/dashboard");
            } else {
                // If no session, wait a moment as Supabase processes the hash
                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                    if (session) {
                        navigate("/dashboard");
                        subscription.unsubscribe();
                    }
                });
            }
        };

        handleAuth();
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-navy-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-300">Completing sign in...</p>
            </div>
        </div>
    );
}

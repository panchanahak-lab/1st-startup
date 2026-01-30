import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
    useEffect(() => {
        const finishLogin = async () => {
            // IMPORTANT: this reads access_token from URL and saves session
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Auth error:", error);
                window.location.href = "/";
                return;
            }

            if (data.session) {
                window.location.href = "/dashboard";
            } else {
                window.location.href = "/";
            }
        };

        finishLogin();
    }, []);

    return <p>Signing you in...</p>;
}

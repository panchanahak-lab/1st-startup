import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                window.location.href = "/dashboard"; // or home after login
            } else {
                window.location.href = "/";
            }
        });
    }, []);

    return <p>Signing you in...</p>;
}

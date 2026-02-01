import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        let redirected = false

        // 1️⃣ Listen for auth state change (CRITICAL)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && !redirected) {
                redirected = true
                navigate('/dashboard', { replace: true })
            }
        })

        // 2️⃣ Fallback check (in case event already fired)
        supabase.auth.getSession().then(({ data }) => {
            if (data.session && !redirected) {
                redirected = true
                navigate('/dashboard', { replace: true })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    return <p style={{ textAlign: 'center' }}>Finalizing Sign In…</p>
}

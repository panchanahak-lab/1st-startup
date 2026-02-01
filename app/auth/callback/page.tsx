import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const finalize = async () => {
            // ✅ CRITICAL LINE (as requested by user)
            // Extracts the code from the URL and exchanges it for a session
            const { error } = await supabase.auth.exchangeCodeForSession(
                window.location.href
            )

            if (error) {
                console.error('OAuth error:', error.message)
                navigate('/', { replace: true })
                return
            }

            navigate('/dashboard', { replace: true })
        }

        finalize()
    }, [navigate])

    return <p style={{ textAlign: 'center' }}>Finalizing Sign In…</p>
}

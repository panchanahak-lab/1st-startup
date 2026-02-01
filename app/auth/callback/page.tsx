import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const finalizeLogin = async () => {
            // Using getSessionFromUrl as requested
            const { data, error } = await supabase.auth.getSessionFromUrl({
                storeSession: true,
            })

            if (error) {
                console.error('OAuth error:', error)
                navigate('/', { replace: true }) // Redirect to home on error
                return
            }

            if (data?.session) {
                navigate('/dashboard', { replace: true })
            } else {
                navigate('/', { replace: true }) // Redirect to home if no session
            }
        }

        finalizeLogin()
    }, [navigate])

    return <p style={{ textAlign: 'center' }}>Finalizing Sign In…</p>
}

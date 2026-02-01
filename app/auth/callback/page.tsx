import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const finishAuth = async () => {
            // This FINALIZES Google login
            const { data, error } = await supabase.auth.getSession()

            if (error) {
                console.error('Auth error:', error)
                navigate('/', { replace: true })
                return
            }

            if (data?.session) {
                navigate('/dashboard', { replace: true }) // or homepage
            } else {
                navigate('/', { replace: true })
            }
        }

        finishAuth()
    }, [navigate])

    return (
        <div style={{ textAlign: 'center', marginTop: '40vh' }}>
            <h3>Finalizing Sign In…</h3>
        </div>
    )
}

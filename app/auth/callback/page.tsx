import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/AuthContext'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()
    const { session, loading } = useAuth()
    const [debugStatus, setDebugStatus] = useState("Initializing...")

    const processingRef = useRef(false)

    useEffect(() => {
        setDebugStatus(`Session: ${!!session}, Loading: ${loading}`)

        if (session) {
            setDebugStatus("Session found. Redirecting...")
            // Small delay to ensure state is stable
            setDebugStatus("Session detected. Redirecting...")
            const timer = setTimeout(() => {
                navigate('/dashboard', { replace: true })
            }, 500) // Increased delay to ensure auth state propagation
            return () => clearTimeout(timer)
        }

        // Allow Supabase to detect session automatically
        if (!loading && !session) {
            setDebugStatus("Waiting for Supabase to detect session...")
            // Poll for session just in case
            const interval = setInterval(async () => {
                const { data } = await supabase.auth.getSession()
                if (data.session) {
                    setDebugStatus("Session recovered via polling. Redirecting...")
                    navigate('/dashboard', { replace: true })
                    clearInterval(interval)
                }
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [session, loading, navigate])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950 text-white p-4">
            <div className="text-center">
                <i className="fas fa-circle-notch fa-spin text-4xl text-brand-500 mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Finalizing Sign In...</h2>
                <p className="text-slate-400 text-sm font-mono">{debugStatus}</p>
            </div>
        </div>
    )
}

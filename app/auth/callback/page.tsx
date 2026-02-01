import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/AuthContext'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()
    const { session, loading } = useAuth()
    const [debugStatus, setDebugStatus] = useState("Initializing...")

    useEffect(() => {
        setDebugStatus(`Session: ${!!session}, Loading: ${loading}`)

        if (session) {
            setDebugStatus("Session found. Redirecting...")
            // Small delay to ensure state is stable
            const timer = setTimeout(() => {
                navigate('/dashboard', { replace: true })
            }, 100)
            return () => clearTimeout(timer)
        }

        if (!loading && !session) {
            // Fallback: Manually check URL for hash if context missed it (race condition)
            const handleHash = async () => {
                setDebugStatus("Checking URL hash...")

                // Manual Hash Parsing
                const hash = window.location.hash
                setDebugStatus(`Checking Hash: ${hash ? 'Present' : 'Empty'} (${hash.length} chars)`)

                if (hash && hash.includes('access_token')) {
                    setDebugStatus("Hash found. Parsing tokens...")
                    try {
                        // Extract tokens from hash
                        const params = new URLSearchParams(hash.substring(1)) // remove #
                        const access_token = params.get('access_token')
                        const refresh_token = params.get('refresh_token')

                        if (access_token) {
                            setDebugStatus("Tokens extracted. Setting session...")
                            const { data, error } = await supabase.auth.setSession({
                                access_token,
                                refresh_token: refresh_token || '',
                            })

                            if (data.session) {
                                setDebugStatus("Session manually set. Redirecting...")
                                navigate('/dashboard', { replace: true })
                                return
                            }
                            if (error) {
                                console.error("setSession error:", error)
                                setDebugStatus(`SetSession Error: ${error.message}`)
                            }
                        } else {
                            setDebugStatus("Access Token missing in hash parameters")
                        }
                    } catch (e: any) {
                        setDebugStatus(`Manual setSession failed: ${e.message}`)
                        console.error("Manual Auth Error:", e)
                    }
                } else {
                    setDebugStatus("No access_token found in hash")
                }

                // If manual parsing failed or no hash, try standard getSession one last time
                setDebugStatus(prev => `${prev} -> Trying standard getSession...`)
                const { data: { session: urlSession }, error } = await supabase.auth.getSession()
                if (urlSession) {
                    setDebugStatus("Hash session recovered. Redirecting...")
                    navigate('/dashboard', { replace: true })
                } else {
                    setDebugStatus("Auth failed. No session found. Please try again.")
                    console.error("Auth Callback failed:", error)
                    setTimeout(() => navigate('/?error=auth_failed'), 3000)
                }
            }
            handleHash()
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

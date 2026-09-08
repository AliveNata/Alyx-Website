import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { checkAuth, clearToken, getToken } from './api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('checking') // checking | in | out
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!getToken()) { setStatus('out'); return }
    checkAuth()
      .then((d) => { setEmail(d.email); setStatus('in') })
      .catch(() => { clearToken(); setStatus('out') })
  }, [])

  // Auto-logout after 5 minutes of no activity.
  useEffect(() => {
    if (status !== 'in') return
    const IDLE_MS = 5 * 60 * 1000
    let timer
    const logout = () => { clearToken(); setEmail(''); setStatus('out') }
    const reset = () => { clearTimeout(timer); timer = setTimeout(logout, IDLE_MS) }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)) }
  }, [status])

  const value = {
    status,
    email,
    signedIn: (em) => { setEmail(em); setStatus('in') },
    signOut: () => { clearToken(); setEmail(''); setStatus('out') },
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// Gate that redirects to the login page when not authenticated.
export function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'checking') {
    return <div className="min-h-screen bg-primary grid place-items-center text-gray-500 font-mono text-sm">Checking session...</div>
  }
  if (status === 'out') return <Navigate to="/admin/login" state={{ from: location }} replace />
  return children
}

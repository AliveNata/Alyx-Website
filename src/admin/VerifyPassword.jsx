import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiPost } from './api'

export default function VerifyPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | ok | error
  const [msg, setMsg] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return // guard against double-run in StrictMode
    done.current = true
    if (!token) { setStatus('error'); setMsg('Token hilang'); return }
    apiPost('/api/auth/password/verify', { token })
      .then(() => setStatus('ok'))
      .catch((e) => { setStatus('error'); setMsg(e.message) })
  }, [token])

  return (
    <div className="min-h-screen bg-primary grid place-items-center px-4">
      <div className="w-full max-w-sm bg-surface-dark border border-surface-border rounded-2xl p-8 text-center">
        <img src="/favicon.svg" alt="" className="w-8 h-8 mx-auto mb-4" />
        {status === 'verifying' && <p className="text-gray-400 font-mono text-sm">Verifying...</p>}
        {status === 'ok' && (
          <div>
            <i className="bi bi-check-circle-fill text-accent-green text-3xl" />
            <p className="text-white font-bold mt-3">Password changed</p>
            <p className="text-gray-500 text-xs font-mono mt-1">All previous sessions were logged out.</p>
            <button onClick={() => navigate('/admin/login')} className="mt-5 px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary">Login</button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <i className="bi bi-x-circle-fill text-red-400 text-3xl" />
            <p className="text-white font-bold mt-3">Failed</p>
            <p className="text-red-400 text-sm font-mono mt-1">{msg}</p>
            <button onClick={() => navigate('/admin/login')} className="mt-5 px-4 py-2 text-sm font-mono text-gray-400 hover:text-white">To login</button>
          </div>
        )}
      </div>
    </div>
  )
}

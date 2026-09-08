import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, apiPost } from './api'
import { useAuth } from './auth'
import { PasswordInput } from './PasswordField'

export default function Login() {
  const [mode, setMode] = useState('login') // login | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signedIn } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const { email: em } = await login(email, password)
      signedIn(em)
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (ex) { setErr(ex.message); setBusy(false) }
  }

  const sendForgot = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await apiPost('/api/auth/forgot', { email }); setForgotSent(true) }
    catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-primary grid place-items-center px-4">
      <div className="w-full max-w-sm bg-surface-dark border border-surface-border rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <img src="/favicon.svg" alt="" className="w-6 h-6" />
          <h1 className="text-lg font-bold text-white">Alyx Admin</h1>
        </div>

        {mode === 'forgot' ? (
          forgotSent ? (
            <div className="mt-4">
              <div className="p-4 rounded-lg border border-accent-green/30 bg-accent-green/5 text-sm text-accent-green">
                <i className="bi bi-envelope-check-fill" /> If the email is registered, a reset link has been sent. Check your inbox.
              </div>
              <button onClick={() => { setMode('login'); setForgotSent(false); setErr('') }} className="mt-4 text-xs font-mono text-gray-400 hover:text-accent-cyan"><i className="bi bi-arrow-left" /> Back to login</button>
            </div>
          ) : (
            <form onSubmit={sendForgot}>
              <p className="text-gray-500 text-xs font-mono mb-6">// enter your admin email, we'll send a reset link</p>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
                className="w-full px-3 py-2.5 mb-5 bg-primary border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-accent-cyan/50" />
              {err && <p className="text-red-400 text-xs font-mono mb-4">{err}</p>}
              <button type="submit" disabled={busy} className="w-full py-2.5 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
                {busy ? 'Sending...' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => { setMode('login'); setErr('') }} className="mt-4 text-xs font-mono text-gray-400 hover:text-accent-cyan"><i className="bi bi-arrow-left" /> Back</button>
            </form>
          )
        ) : (
          <form onSubmit={submit}>
            <p className="text-gray-500 text-xs font-mono mb-6">// sign in to manage your portfolio</p>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
              className="w-full px-3 py-2.5 mb-4 bg-primary border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-accent-cyan/50" />

            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
            <PasswordInput value={password} onChange={setPassword} />

            {err && <p className="text-red-400 text-xs font-mono mt-4 flex items-center gap-1"><i className="bi bi-exclamation-triangle-fill" /> {err}</p>}

            <button type="submit" disabled={busy} className="w-full mt-5 py-2.5 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
              {busy ? 'Signing in...' : '$ sign_in()'}
            </button>
            <button type="button" onClick={() => { setMode('forgot'); setErr('') }} className="mt-4 block mx-auto text-xs font-mono text-gray-500 hover:text-accent-cyan">Forgot password?</button>
          </form>
        )}
      </div>
    </div>
  )
}

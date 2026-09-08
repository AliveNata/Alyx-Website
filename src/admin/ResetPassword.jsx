import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiPost } from './api'
import { PasswordInput, PasswordChecklist } from './PasswordField'
import { passwordValid } from './passwordRules'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState({ status: '' })
  const canSubmit = passwordValid(pw) && pw === confirm && token

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'sending' })
    try { await apiPost('/api/auth/reset', { token, new_password: pw }); setState({ status: 'done' }) }
    catch (ex) { setState({ status: 'error', msg: ex.message }) }
  }

  return (
    <div className="min-h-screen bg-primary grid place-items-center px-4">
      <div className="w-full max-w-sm bg-surface-dark border border-surface-border rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-1"><img src="/favicon.svg" alt="" className="w-6 h-6" /><h1 className="text-lg font-bold text-white">Reset password</h1></div>
        <p className="text-gray-500 text-xs font-mono mb-6">// create a new password</p>

        {!token ? (
          <p className="text-red-400 text-sm font-mono">Incomplete link (missing token).</p>
        ) : state.status === 'done' ? (
          <div className="text-sm text-accent-green"><i className="bi bi-check-circle-fill" /> Password changed successfully. <button onClick={() => navigate('/admin/login')} className="underline hover:text-accent-cyan">Log in now</button></div>
        ) : (
          <form onSubmit={submit}>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">New password</label>
            <PasswordInput value={pw} onChange={setPw} autoFocus />
            <PasswordChecklist value={pw} />
            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 mt-4">Confirm</label>
            <PasswordInput value={confirm} onChange={setConfirm} placeholder="Repeat password" />
            {confirm && pw !== confirm && <p className="text-red-400 text-[12px] font-mono mt-1.5">Passwords don't match</p>}
            {state.status === 'error' && <p className="text-red-400 text-sm font-mono mt-3">{state.msg}</p>}
            <button type="submit" disabled={!canSubmit || state.status === 'sending'} className="mt-5 w-full py-2.5 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-40">
              {state.status === 'sending' ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

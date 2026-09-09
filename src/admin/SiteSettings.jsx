import { useEffect, useState } from 'react'
import { apiGet, apiPut, apiPost } from './api'
import { PasswordInput, PasswordChecklist } from './PasswordField'
import { passwordValid } from './passwordRules'

function ChangePassword() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState({ status: '' }) // status: '' | sending | sent | error text
  const canSend = passwordValid(pw) && pw === confirm

  const send = async () => {
    setState({ status: 'sending' })
    try {
      const r = await apiPost('/api/auth/password/request', { new_password: pw })
      setState({ status: 'sent', email: r.email })
      setPw(''); setConfirm('')
    } catch (e) { setState({ status: 'error', msg: e.message }) }
  }

  return (
    <div className="mt-10 pt-8 border-t border-surface-border max-w-md">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><i className="bi bi-key text-accent-cyan" /> Change password</h3>
      <p className="text-gray-500 text-xs font-mono mb-4">// a verification link is emailed before the change applies</p>

      {state.status === 'sent' ? (
        <div className="p-4 rounded-lg border border-accent-green/30 bg-accent-green/5 text-sm text-accent-green">
          <i className="bi bi-envelope-check-fill" /> Verification link sent to <b>{state.email}</b>. Open your email and click the link to activate the new password.
        </div>
      ) : (
        <>
          <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">New password</label>
          <PasswordInput value={pw} onChange={setPw} />
          <PasswordChecklist value={pw} />

          <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 mt-4">Confirm password</label>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="Repeat password" />
          {confirm && pw !== confirm && <p className="text-red-400 text-[12px] font-mono mt-1.5">Passwords don't match</p>}

          <button onClick={send} disabled={!canSend || state.status === 'sending'}
            className="mt-5 px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-40 disabled:cursor-not-allowed">
            {state.status === 'sending' ? 'Sending...' : 'Send verification link'}
          </button>
          {state.status === 'error' && <p className="text-red-400 text-sm font-mono mt-3">{state.msg}</p>}
        </>
      )}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'
const labelCls = 'block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5'

export default function SiteSettings() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => { apiGet('/api/settings/all').then(setForm).catch(() => setForm({ contact_endpoint: '', telegram_chat_id: '' })) }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setStatus('saving')
    try { await apiPut('/api/settings', form); setStatus('saved'); setTimeout(() => setStatus(''), 2000) }
    catch (e) { setStatus(e.message) }
  }

  if (!form) return <p className="text-gray-500 font-mono text-sm">Loading...</p>

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1"><i className="bi bi-sliders text-accent-cyan" /> Settings</h2>
      <p className="text-gray-500 text-xs font-mono mb-6">// non-secret config (was in Netlify env)</p>

      <div className="mb-5">
        <label className={labelCls}>Contact form endpoint</label>
        <input className={inputCls} value={form.contact_endpoint || ''} onChange={(e) => set('contact_endpoint', e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec" />
        <p className="text-gray-600 text-[10px] mt-1 font-mono">Google Apps Script Web App URL that receives contact form submissions.</p>
      </div>

      <div className="mb-6">
        <label className={labelCls}>Telegram chat ID</label>
        <input className={inputCls} value={form.telegram_chat_id || ''} onChange={(e) => set('telegram_chat_id', e.target.value)}
          placeholder="123456789" />
        <p className="text-gray-600 text-[10px] mt-1 font-mono">Destination for CV-download notifications. The bot token stays secret in the server env.</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={status === 'saving'} className="px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-accent-green text-sm font-mono flex items-center gap-1"><i className="bi bi-check-circle-fill" /> Saved</span>}
        {status && !['saving', 'saved'].includes(status) && <span className="text-red-400 text-sm font-mono">{status}</span>}
      </div>

      <p className="text-gray-600 text-[11px] font-mono mt-6 leading-relaxed">
        If left empty, the system falls back to the environment values (VITE_CONTACT_SHEET_URL / TELEGRAM_CHAT_ID).
      </p>

      <ChangePassword />
    </div>
  )
}

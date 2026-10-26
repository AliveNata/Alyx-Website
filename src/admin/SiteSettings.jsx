import { useEffect, useRef, useState } from 'react'
import { apiGet, apiPut, apiPost, uploadCv } from './api'
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

// CV / Resume management (PK-18). Preview the current managed CV and upload a
// replacement. The upload is its own endpoint (POST /api/admin/cv), separate from
// the Save button below, so the preview refreshes the moment it succeeds and
// never waits on the text-field save.
function CvBlock({ cvUrl, onUploaded }) {
  const fileRef = useRef(null)
  const [state, setState] = useState({ status: 'idle', error: '' }) // idle | uploading | error

  const pick = () => fileRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be re-picked after an error
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setState({ status: 'error', error: 'Pick a PDF file.' })
      return
    }
    setState({ status: 'uploading', error: '' })
    try {
      const url = await uploadCv(file)
      onUploaded(url)
      setState({ status: 'idle', error: '' })
    } catch (err) {
      setState({ status: 'error', error: err.message || 'Upload failed' })
    }
  }

  const uploading = state.status === 'uploading'

  return (
    <div className="mb-6">
      <label className={labelCls}>CV / Resume</label>

      {cvUrl ? (
        <div className="rounded-lg border border-surface-border overflow-hidden bg-primary">
          <iframe src={cvUrl} title="Current CV" className="w-full h-64 bg-white" />
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-surface-border">
            <span className="text-gray-500 text-[11px] font-mono truncate">Current CV</span>
            <a href={cvUrl} target="_blank" rel="noopener noreferrer"
              className="text-accent-cyan text-[11px] font-mono hover:underline shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 rounded">
              Open in new tab
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center">
          <p className="text-gray-400 text-sm">No CV uploaded yet</p>
          <p className="text-gray-600 text-[11px] font-mono mt-1">The public get_cv serves the bundled file until you upload one.</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3">
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} className="hidden" />
        <button onClick={pick} disabled={uploading}
          className="px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50">
          {uploading ? 'Uploading...' : cvUrl ? 'Replace CV' : 'Upload CV'}
        </button>
        <span className="text-gray-600 text-[10px] font-mono">PDF only, up to 8 MB.</span>
      </div>
      {state.status === 'error' && <p className="text-red-400 text-sm font-mono mt-2">{state.error}</p>}
    </div>
  )
}

export default function SiteSettings() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => { apiGet('/api/settings/all').then(setForm).catch(() => setForm({ contact_endpoint: '', telegram_chat_id: '', cv_url: '', cv_lead_capture: false })) }, [])
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

      <div className="border-t border-surface-border pt-6 mb-2">
        <CvBlock cvUrl={form.cv_url || ''} onUploaded={(url) => set('cv_url', url)} />

        <label className="flex items-start gap-3 cursor-pointer select-none mb-6">
          <input type="checkbox" checked={!!form.cv_lead_capture} onChange={(e) => set('cv_lead_capture', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50" />
          <span>
            <span className="block text-sm text-white">Offer email follow-up after a CV download</span>
            <span className="block text-gray-600 text-[10px] font-mono mt-0.5">When on, visitors see a dismissible field to leave their email after downloading. It never blocks the download. Saved with the button below.</span>
          </span>
        </label>
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

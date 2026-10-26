import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut } from './api'

const inputCls = 'w-full px-3 py-2 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'
const labelCls = 'block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5'

// Snapshot fields pulled back into the editor by "Load into editor". Mirrors the
// tracked set on the server (promptVersions.js); the admin reviews, then Saves.
const VERSION_FIELDS = ['system_prompt', 'model', 'reasoning_effort', 'temperature', 'max_tokens', 'greeting']

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-4 p-3 rounded-lg border border-surface-border hover:border-accent-cyan/30 transition-all text-left">
      <div>
        <div className="text-sm text-white">{label}</div>
        {hint && <div className="text-[11px] text-gray-500 font-mono mt-0.5">{hint}</div>}
      </div>
      <span className={`shrink-0 w-10 h-6 rounded-full p-0.5 transition-all ${checked ? 'bg-accent-cyan' : 'bg-surface-border'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition-all ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  )
}

const fmtTs = (s) => { try { return new Date(s).toLocaleString() } catch { return String(s) } }
const firstLine = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 90)

// One row in the version history: metadata, a one-line preview, and the two
// non-destructive actions (load into the editor, or expand the full text).
function VersionRow({ v, onLoad }) {
  const [full, setFull] = useState(false)
  const temp = v.temperature != null ? Number(v.temperature) : null
  return (
    <li className="py-3 border-b border-surface-border last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-gray-500">{fmtTs(v.created_at)}</div>
          <p className="text-[12.5px] text-gray-300 mt-1 truncate">{firstLine(v.system_prompt) || '(empty prompt)'}</p>
          <div className="font-mono text-[10px] text-gray-600 mt-1">
            {v.model || 'default model'}
            {temp != null ? ` - temp ${temp}` : ''}
            {v.max_tokens != null ? ` - ${v.max_tokens} tok` : ''}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <button type="button" onClick={() => onLoad(v)} className="px-2.5 py-1 text-[11px] font-mono rounded-md border border-surface-border text-accent-cyan hover:border-accent-cyan/50 transition-all">
            Load into editor
          </button>
          <button type="button" onClick={() => setFull((f) => !f)} className="px-2.5 py-1 text-[11px] font-mono rounded-md text-gray-500 hover:text-gray-300 transition-all">
            {full ? 'Hide full' : 'View full'}
          </button>
        </div>
      </div>
      {full && (
        <pre className="mt-2 p-3 bg-primary border border-surface-border rounded-lg text-[11.5px] text-gray-300 whitespace-pre-wrap font-mono max-h-64 overflow-auto">{v.system_prompt || '(empty prompt)'}</pre>
      )}
    </li>
  )
}

// Collapsible history of saved prompt + tuning snapshots. Lazy: fetches on first
// open, and refetches when refreshKey changes (a save just created a version).
function VersionHistory({ refreshKey, onLoad }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState('idle') // idle | loading | ready | error
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  const load = async () => {
    setState('loading'); setErr('')
    try {
      const data = await apiGet('/api/admin/prompt-versions')
      setRows(Array.isArray(data.rows) ? data.rows : [])
      setState('ready')
    } catch (e) { setErr(e.message); setState('error') }
  }

  useEffect(() => { if (open) load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, refreshKey])

  return (
    <div className="mb-5 border border-surface-border rounded-lg">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left">
        <span className="flex items-center gap-2 text-sm text-white">
          <i className={`bi bi-clock-history text-accent-cyan`} /> Version history
          <span className="font-mono text-[10px] text-gray-500">snapshot on every save</span>
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} text-gray-500`} />
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-surface-border">
          {state === 'loading' && <p className="text-gray-500 font-mono text-xs py-3">Loading versions...</p>}
          {state === 'error' && (
            <div className="py-3">
              <p className="text-red-400 font-mono text-xs">{err}</p>
              <button type="button" onClick={load} className="mt-2 px-2.5 py-1 text-[11px] font-mono rounded-md border border-surface-border text-gray-300 hover:border-accent-cyan/50">Try again</button>
            </div>
          )}
          {state === 'ready' && rows.length === 0 && (
            <p className="text-gray-500 text-xs py-3">No versions yet. Edit the prompt or tuning and Save to capture the first one here.</p>
          )}
          {state === 'ready' && rows.length > 0 && (
            <ul className="mt-1">{rows.map((v) => <VersionRow key={v.id} v={v} onLoad={onLoad} />)}</ul>
          )}
        </div>
      )}
    </div>
  )
}

// Try the CURRENT form (unsaved candidate prompt + tuning) against a sample
// question, without touching live settings. Mirrors the live portfolio path:
// grounded reply with cited sections, or the fixed not-sure reply below the
// grounding threshold.
function Playground({ form }) {
  const [question, setQuestion] = useState('')
  const [state, setState] = useState('idle') // idle | loading | ready | error
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  const run = async () => {
    const message = question.trim()
    if (!message) return
    setState('loading'); setErr(''); setResult(null)
    try {
      const data = await apiPost('/api/admin/prompt-preview', {
        system_prompt: form.system_prompt || '',
        model: form.model || '',
        reasoning_effort: form.reasoning_effort || 'low',
        temperature: form.temperature ?? 0.7,
        max_tokens: form.max_tokens ?? 700,
        message,
      })
      setResult(data); setState('ready')
    } catch (e) { setErr(e.message); setState('error') }
  }

  return (
    <div className="mb-6 border border-surface-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-sm text-white mb-1">
        <i className="bi bi-play-circle text-accent-cyan" /> Playground
      </div>
      <p className="text-gray-600 text-[10px] font-mono mb-3">Runs the form above against one question. Nothing is saved, logged, or billed.</p>

      <label className={labelCls}>Sample question</label>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && state !== 'loading') run() }}
          placeholder="e.g. What data pipelines has Alief built?"
        />
        <button type="button" onClick={run} disabled={state === 'loading' || !question.trim()} className="shrink-0 px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
          {state === 'loading' ? 'Running...' : 'Run test'}
        </button>
      </div>

      {state === 'error' && <p className="text-red-400 font-mono text-xs mt-3">{err}</p>}

      {state === 'ready' && result && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            {result.grounded ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-accent-green border border-accent-green/30">
                <i className="bi bi-check-circle" /> grounded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-gray-400 border border-surface-border">
                <i className="bi bi-question-circle" /> not sure (below threshold)
              </span>
            )}
            {result.usedSections?.length > 0 && (
              <span className="font-mono text-[10px] text-gray-500">cited: {result.usedSections.join(', ')}</span>
            )}
          </div>
          <div className="p-3 bg-primary border border-surface-border rounded-lg text-[13px] text-gray-200 whitespace-pre-wrap leading-relaxed">{result.reply}</div>
        </div>
      )}
    </div>
  )
}

export default function ChatbotSettings() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('')
  const [loadedNote, setLoadedNote] = useState('')
  // Bumped after a successful save so the history panel refetches the new version.
  const [savedAt, setSavedAt] = useState(0)

  // Authed load: the admin form edits contact_email, which the public GET no
  // longer returns (PK-24), so it reads the full row from /api/admin/chatbot.
  useEffect(() => { apiGet('/api/admin/chatbot').then((d) => setForm({ ...d, temperature: Number(d.temperature ?? 0.7) })).catch(() => setForm({})) }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Pull a saved snapshot back into the form fields. Non-destructive: it only
  // fills the editor; the admin reviews and clicks Save to apply (which itself
  // snapshots again). temperature is coerced to a number for the input.
  const loadVersion = (v) => {
    setForm((f) => {
      const next = { ...f }
      for (const k of VERSION_FIELDS) next[k] = k === 'temperature' ? Number(v[k] ?? 0.7) : (v[k] ?? '')
      return next
    })
    setLoadedNote(`Loaded the version from ${fmtTs(v.created_at)} into the editor. Review, then Save to apply.`)
  }

  const save = async () => {
    setStatus('saving')
    try {
      await apiPut('/api/chatbot', form)
      setStatus('saved'); setLoadedNote('')
      setSavedAt(Date.now())
      setTimeout(() => setStatus(''), 2000)
    } catch (e) { setStatus(e.message) }
  }

  if (!form) return <p className="text-gray-500 font-mono text-sm">Loading...</p>

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1"><i className="bi bi-robot text-accent-cyan" /> Chatbot</h2>
      <p className="text-gray-500 text-xs font-mono mb-6">// Alyx AI settings - API key stays server-side</p>

      {/* LLM tuning */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2"><label className={labelCls}>Model</label>
          <input className={inputCls} value={form.model || ''} onChange={(e) => set('model', e.target.value)} placeholder="openai/gpt-oss-20b" /></div>
        <div><label className={labelCls}>Reasoning effort</label>
          <select className={inputCls} value={form.reasoning_effort || 'low'} onChange={(e) => set('reasoning_effort', e.target.value)}>
            {['low', 'medium', 'high'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select></div>
        <div><label className={labelCls}>Temperature</label>
          <input type="number" step="0.1" min="0" max="2" className={inputCls} value={form.temperature ?? 0.7} onChange={(e) => set('temperature', Number(e.target.value))} /></div>
        <div><label className={labelCls}>Max tokens</label>
          <input type="number" className={inputCls} value={form.max_tokens ?? 700} onChange={(e) => set('max_tokens', Number(e.target.value))} /></div>
      </div>

      {/* Persona / system prompt */}
      <div className="mb-4">
        <label className={labelCls}>System prompt (persona &amp; rules)</label>
        <textarea className={`${inputCls} min-h-[280px] resize-y font-mono text-[12.5px] leading-relaxed`} value={form.system_prompt || ''} onChange={(e) => set('system_prompt', e.target.value)} />
        <p className="text-gray-600 text-[10px] mt-1 font-mono">Portfolio data (skills, experience, etc.) is pulled in automatically from the database, no need to write it here.</p>
      </div>

      {/* Version history (PK-1): snapshots of prompt + tuning, loadable back in. */}
      <VersionHistory refreshKey={savedAt} onLoad={loadVersion} />
      {loadedNote && <p className="text-accent-cyan text-[11px] font-mono -mt-3 mb-5 flex items-center gap-1"><i className="bi bi-arrow-down-circle" /> {loadedNote}</p>}

      {/* Playground (PK-1): try the current (unsaved) config before applying it. */}
      <Playground form={form} />

      {/* Greeting override */}
      <div className="mb-5">
        <label className={labelCls}>Greeting override (optional)</label>
        <input className={inputCls} value={form.greeting || ''} onChange={(e) => set('greeting', e.target.value)} placeholder="Leave empty = automatic greeting (time & language aware)" />
      </div>

      {/* Lead-funnel destinations (P3-2). A blank field hides that channel's CTA
          chip in the chat, so each channel rolls out independently. */}
      <div className="mb-6">
        <label className={labelCls}>Lead funnel destinations</label>
        <p className="text-gray-600 text-[10px] mb-2 font-mono">Leave a field blank to hide that channel's chip in the chat.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Booking link (Calendly)</label>
            <input className={inputCls} value={form.calendly_url || ''} onChange={(e) => set('calendly_url', e.target.value)} placeholder="https://calendly.com/..." />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Mentoring link (SociaBuzz)</label>
            <input className={inputCls} value={form.sociabuzz_url || ''} onChange={(e) => set('sociabuzz_url', e.target.value)} placeholder="https://sociabuzz.com/..." />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Contact email (where leads land)</label>
            <input type="email" className={inputCls} value={form.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="space-y-2 mb-6">
        <Toggle label="Companion modes" hint="Casual chat & English practice" checked={form.enable_companion !== false} onChange={(v) => set('enable_companion', v)} />
        <Toggle label="Voice" hint="Text-to-speech & mic input" checked={form.enable_voice !== false} onChange={(v) => set('enable_voice', v)} />
        <Toggle label="Site actions" hint="Scroll to sections, open links, download CV, switch theme" checked={form.enable_site_actions !== false} onChange={(v) => set('enable_site_actions', v)} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={status === 'saving'} className="px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-accent-green text-sm font-mono flex items-center gap-1"><i className="bi bi-check-circle-fill" /> Saved</span>}
        {status && !['saving', 'saved'].includes(status) && <span className="text-red-400 text-sm font-mono">{status}</span>}
      </div>
    </div>
  )
}

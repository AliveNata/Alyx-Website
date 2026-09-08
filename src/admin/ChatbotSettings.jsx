import { useEffect, useState } from 'react'
import { apiGet, apiPut } from './api'

const inputCls = 'w-full px-3 py-2 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'
const labelCls = 'block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5'

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

export default function ChatbotSettings() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => { apiGet('/api/chatbot').then((d) => setForm({ ...d, temperature: Number(d.temperature ?? 0.7) })).catch(() => setForm({})) }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setStatus('saving')
    try { await apiPut('/api/chatbot', form); setStatus('saved'); setTimeout(() => setStatus(''), 2000) }
    catch (e) { setStatus(e.message) }
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

      {/* Greeting override */}
      <div className="mb-5">
        <label className={labelCls}>Greeting override (optional)</label>
        <input className={inputCls} value={form.greeting || ''} onChange={(e) => set('greeting', e.target.value)} placeholder="Leave empty = automatic greeting (time & language aware)" />
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

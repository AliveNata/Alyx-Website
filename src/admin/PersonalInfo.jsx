import { useEffect, useState } from 'react'
import { apiGet, apiPut } from './api'
import { FieldInput } from './fields'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'nickname', label: 'Nickname', type: 'text' },
  { name: 'title', label: 'Title', type: 'text', placeholder: 'Data Engineer & BI Analyst' },
  { name: 'tagline', label: 'Tagline', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'github', label: 'GitHub URL', type: 'text' },
  { name: 'linkedin', label: 'LinkedIn URL', type: 'text' },
  { name: 'bio', label: 'Bio', type: 'textarea' },
]

export default function PersonalInfo() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('') // '' | saving | saved | error msg

  useEffect(() => { apiGet('/api/personal').then((d) => setForm(d || {})).catch(() => setForm({})) }, [])

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))

  const save = async () => {
    setStatus('saving')
    try { await apiPut('/api/personal', form); setStatus('saved'); setTimeout(() => setStatus(''), 2000) }
    catch (e) { setStatus(e.message) }
  }

  if (!form) return <p className="text-gray-500 font-mono text-sm">Loading...</p>

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5"><i className="bi bi-person-badge text-accent-cyan" /> Personal Info</h2>
      <div className="space-y-4">
        {FIELDS.map((f) => <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => set(f.name, v)} />)}
      </div>
      <div className="flex items-center gap-3 mt-6">
        <button onClick={save} disabled={status === 'saving'} className="px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-accent-green text-sm font-mono flex items-center gap-1"><i className="bi bi-check-circle-fill" /> Saved</span>}
        {status && !['saving', 'saved'].includes(status) && <span className="text-red-400 text-sm font-mono">{status}</span>}
      </div>
    </div>
  )
}

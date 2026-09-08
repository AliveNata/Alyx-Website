import { useState } from 'react'
import { uploadImage } from './api'
import { SkillIcon } from '../components/Skills'

const inputCls = 'w-full px-3 py-2 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'
const labelCls = 'block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5'

function Label({ field }) {
  return <label className={labelCls}>{field.label}{field.required && <span className="text-accent-cyan"> *</span>}</label>
}

// url text input + optional file upload with preview
function ImageField({ field, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file)) }
    catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }
  return (
    <div>
      <Label field={field} />
      <div className="flex gap-2 items-center">
        <input className={inputCls} value={value || ''} placeholder="Paste image URL, or upload" onChange={(e) => onChange(e.target.value)} />
        <label className={`shrink-0 px-3 py-2 rounded-lg border border-surface-border text-xs font-mono cursor-pointer hover:border-accent-cyan/40 hover:text-accent-cyan transition-all ${busy ? 'opacity-50 pointer-events-none' : 'text-gray-400'}`}>
          {busy ? '...' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {err && <p className="text-red-400 text-[11px] mt-1 font-mono">{err}</p>}
      {value && <img src={value} alt="" className="mt-2 h-20 rounded-lg border border-surface-border object-cover" />}
    </div>
  )
}

// Icon field: live preview (identical to the site) + type a class/path, or
// upload / drag & drop an image file which becomes the icon.
function IconField({ field, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')

  const doUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setErr('Must be an image file'); return }
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file)) }
    catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <Label field={field} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); doUpload(e.dataTransfer.files?.[0]) }}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${drag ? 'border-accent-cyan bg-accent-cyan/5' : 'border-surface-border'}`}
      >
        {/* Preview */}
        <div className="w-14 h-14 shrink-0 grid place-items-center rounded-lg bg-primary border border-surface-border overflow-hidden">
          {value ? <SkillIcon icon={value} name="preview" size={34} /> : <i className="bi bi-image text-gray-600 text-xl" />}
        </div>
        {/* Input + upload */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2">
            <input className={inputCls} value={value || ''} placeholder="devicon-python-plain colored  |  /icons/dbt.svg  |  emoji"
              onChange={(e) => onChange(e.target.value)} />
            <label className={`shrink-0 px-3 py-2 rounded-lg border border-surface-border text-xs font-mono cursor-pointer hover:border-accent-cyan/40 hover:text-accent-cyan transition-all ${busy ? 'opacity-50 pointer-events-none' : 'text-gray-400'}`}>
              {busy ? '...' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => doUpload(e.target.files?.[0])} />
            </label>
          </div>
          <p className="text-gray-600 text-[10px] mt-1 font-mono">Type a class/emoji, or drag &amp; drop / upload an image here</p>
        </div>
      </div>
      {err && <p className="text-red-400 text-[11px] mt-1 font-mono">{err}</p>}
    </div>
  )
}

// array of strings edited as comma-separated
function TagsField({ field, value, onChange }) {
  const arr = Array.isArray(value) ? value : []
  return (
    <div>
      <Label field={field} />
      <input className={inputCls} value={arr.join(', ')} placeholder="comma, separated, values"
        onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
      <p className="text-gray-600 text-[10px] mt-1 font-mono">Separate with commas</p>
    </div>
  )
}

// array of strings edited as one-per-line (bullet points)
function LinesField({ field, value, onChange }) {
  const arr = Array.isArray(value) ? value : []
  return (
    <div>
      <Label field={field} />
      <textarea className={`${inputCls} min-h-[110px] resize-y font-mono`} value={arr.join('\n')} placeholder="One item per line"
        onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
      <p className="text-gray-600 text-[10px] mt-1 font-mono">One line = one item</p>
    </div>
  )
}

// array of { icon, text } for award metrics
function MetricsField({ field, value, onChange }) {
  const arr = Array.isArray(value) ? value : []
  const update = (i, patch) => onChange(arr.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  const remove = (i) => onChange(arr.filter((_, idx) => idx !== i))
  const add = () => onChange([...arr, { icon: 'award', text: '' }])
  return (
    <div>
      <Label field={field} />
      <div className="space-y-2">
        {arr.map((m, i) => (
          <div key={i} className="flex gap-2">
            <select className={`${inputCls} w-32 shrink-0`} value={m.icon || 'award'} onChange={(e) => update(i, { icon: e.target.value })}>
              {['award', 'building', 'medal'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input className={inputCls} value={m.text || ''} placeholder="Metric text" onChange={(e) => update(i, { text: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="shrink-0 px-2 text-gray-500 hover:text-red-400"><i className="bi bi-trash" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-xs font-mono text-accent-cyan hover:text-accent-green">+ add metric</button>
    </div>
  )
}

// { title, detail } object (freelance highlight) - nullable
function HighlightField({ field, value, onChange }) {
  const v = value || {}
  const has = value && (v.title || v.detail)
  return (
    <div>
      <Label field={field} />
      {has ? (
        <div className="space-y-2">
          <input className={inputCls} value={v.title || ''} placeholder="Highlight title" onChange={(e) => onChange({ ...v, title: e.target.value })} />
          <textarea className={`${inputCls} min-h-[70px] resize-y`} value={v.detail || ''} placeholder="Highlight detail" onChange={(e) => onChange({ ...v, detail: e.target.value })} />
          <button type="button" onClick={() => onChange(null)} className="text-xs font-mono text-gray-500 hover:text-red-400">remove highlight</button>
        </div>
      ) : (
        <button type="button" onClick={() => onChange({ title: '', detail: '' })} className="text-xs font-mono text-accent-cyan hover:text-accent-green">+ add highlight</button>
      )}
    </div>
  )
}

export function FieldInput({ field, value, onChange }) {
  switch (field.type) {
    case 'icon': return <IconField field={field} value={value} onChange={onChange} />
    case 'image': return <ImageField field={field} value={value} onChange={onChange} />
    case 'tags': return <TagsField field={field} value={value} onChange={onChange} />
    case 'lines': return <LinesField field={field} value={value} onChange={onChange} />
    case 'metrics': return <MetricsField field={field} value={value} onChange={onChange} />
    case 'highlight': return <HighlightField field={field} value={value} onChange={onChange} />
    case 'textarea':
      return <div><Label field={field} /><textarea className={`${inputCls} min-h-[90px] resize-y`} value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} /></div>
    case 'select':
      return <div><Label field={field} /><select className={inputCls} value={value || field.options?.[0]?.value} onChange={(e) => onChange(e.target.value)}>{field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
    case 'number':
      return <div><Label field={field} /><input type="number" className={inputCls} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} /></div>
    default:
      return <div><Label field={field} /><input className={inputCls} value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} /></div>
  }
}

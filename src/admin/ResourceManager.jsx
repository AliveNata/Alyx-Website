import { useEffect, useState, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from './api'
import { FieldInput } from './fields'
import { Pager, PAGE_SIZE } from './Pager'

// Build an empty record from the field list (arrays/objects default sensibly).
function blankRecord(fields) {
  const rec = {}
  for (const f of fields) {
    if (f.type === 'tags' || f.type === 'lines' || f.type === 'metrics') rec[f.name] = []
    else if (f.type === 'highlight') rec[f.name] = null
    else if (f.type === 'number') rec[f.name] = f.name === 'level' ? 80 : 0
    else if (f.type === 'select') rec[f.name] = f.options?.[0]?.value ?? ''
    else rec[f.name] = ''
  }
  return rec
}

function Editor({ config, record, onClose, onSaved }) {
  const [form, setForm] = useState(record)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isNew = record.id == null

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))

  const save = async () => {
    const missing = config.fields.find((f) => f.required && !String(form[f.name] || '').trim())
    if (missing) { setErr(`${missing.label} wajib diisi`); return }
    setSaving(true); setErr('')
    try {
      const saved = isNew
        ? await apiPost(config.endpoint, form)
        : await apiPut(`${config.endpoint}/${record.id}`, form)
      onSaved(saved, isNew)
    } catch (ex) { setErr(ex.message); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" onMouseDown={onClose}>
      <div className="bg-surface-dark border border-surface-border rounded-xl w-full max-w-2xl my-8" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="font-bold text-white">{isNew ? `New ${config.newLabel}` : `Edit ${config.newLabel}`}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><i className="bi bi-x-lg" /></button>
        </div>
        <div className="p-5 space-y-4">
          {config.fields.map((f) => (
            <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => set(f.name, v)} />
          ))}
          {err && <p className="text-red-400 text-sm font-mono">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-surface-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-mono text-gray-400 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceManager({ config }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    apiGet(config.endpoint)
      .then((rows) => { setItems(rows); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [config.endpoint])

  useEffect(() => { load() }, [load])
  // Reset to page 1 when switching resource.
  useEffect(() => { setPage(1) }, [config.endpoint])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageStart = (Math.min(page, totalPages) - 1) * PAGE_SIZE
  const displayed = items.slice(pageStart, pageStart + PAGE_SIZE)
  // Step back a page if the current one emptied out (e.g. after a delete).
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages, page])

  const onSaved = (saved, isNew) => {
    setItems((prev) => isNew ? [...prev, saved] : prev.map((it) => it.id === saved.id ? saved : it))
    setEditing(null)
  }

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title || item.name || item.role}"?`)) return
    await apiDelete(`${config.endpoint}/${item.id}`)
    setItems((prev) => prev.filter((it) => it.id !== item.id))
  }

  const move = async (index, dir) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    await apiPut(`${config.endpoint}/reorder/all`, { ids: next.map((it) => it.id) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><i className={`bi ${config.icon} text-accent-cyan`} /> {config.title}</h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">{items.length} item</p>
        </div>
        <button onClick={() => setEditing(blankRecord(config.fields))} className="px-3.5 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25">
          + New {config.newLabel}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm font-mono mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-500 font-mono text-sm">Loading...</p>
      ) : (
        <div className="border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-card border-b border-surface-border text-left">
                {config.columns.map((c) => <th key={c.key} className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">{c.label}</th>)}
                <th className="px-4 py-2.5 w-32" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((item, i) => {
                const gi = pageStart + i // index in the full list, for reordering
                return (
                <tr key={item.id} className="border-b border-surface-border last:border-0 hover:bg-surface-card/40">
                  {config.columns.map((c) => {
                    const val = c.render ? c.render(item[c.key]) : String(item[c.key] ?? '')
                    return (
                      <td key={c.key} title={typeof val === 'string' ? val : undefined} className="px-4 py-3 text-gray-300 align-top max-w-[280px] truncate">
                        {val}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end text-gray-500">
                      <button title="Up" onClick={() => move(gi, -1)} disabled={gi === 0} className="p-1.5 hover:text-accent-cyan disabled:opacity-25"><i className="bi bi-arrow-up" /></button>
                      <button title="Down" onClick={() => move(gi, 1)} disabled={gi === items.length - 1} className="p-1.5 hover:text-accent-cyan disabled:opacity-25"><i className="bi bi-arrow-down" /></button>
                      <button title="Edit" onClick={() => setEditing(item)} className="p-1.5 hover:text-accent-green"><i className="bi bi-pencil" /></button>
                      <button title="Delete" onClick={() => remove(item)} className="p-1.5 hover:text-red-400"><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-gray-600 font-mono text-sm">No data yet. Click "+ New {config.newLabel}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && <Pager page={Math.min(page, totalPages)} total={totalPages} onChange={setPage} />}

      {editing && <Editor config={config} record={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </div>
  )
}

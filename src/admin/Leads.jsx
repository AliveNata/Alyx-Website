import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch } from './api'

// Admin lead management (P3-3). Lists captured leads newest-first, lets the owner
// read a lead's redacted transcript, and moves it through new -> contacted ->
// closed. The one decision here is who to follow up and how, so hot leads carry
// the single amber accent and every control acts on a real lead.

const STATUSES = ['new', 'contacted', 'closed']
const FILTERS = [{ key: 'all', label: 'All' }, ...STATUSES.map((s) => ({ key: s, label: s }))]

const channelLabel = { booking: 'Booking', sociabuzz: 'Mentoring', email: 'Email' }
const channelIcon = { booking: 'bi-calendar-check', sociabuzz: 'bi-mortarboard', email: 'bi-envelope' }

const fmtTime = (iso) => {
  try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return String(iso) }
}

// One lead, as a reflowing card (no table, so nothing overflows on a phone). The
// status select writes through to the API; the transcript loads on first open.
function LeadCard({ lead, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [patching, setPatching] = useState(false)
  const [patchError, setPatchError] = useState('')
  const [tx, setTx] = useState({ status: 'idle', messages: [], context: null, error: '' })

  const hot = lead.intent_tier === 'hot'

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && tx.status === 'idle') {
      setTx((t) => ({ ...t, status: 'loading' }))
      apiGet(`/api/admin/leads/${lead.id}/transcript`)
        .then((d) => setTx({ status: 'ok', messages: Array.isArray(d.messages) ? d.messages : [], context: d.context_summary || null, error: '' }))
        .catch((e) => setTx({ status: 'error', messages: [], context: null, error: e.message || 'Failed to load' }))
    }
  }

  const changeStatus = (e) => {
    const next = e.target.value
    const prev = lead.status
    if (next === prev) return
    setPatching(true)
    setPatchError('')
    onStatusChange(lead.id, next) // optimistic
    apiPatch(`/api/admin/leads/${lead.id}`, { status: next })
      .then((row) => onStatusChange(lead.id, row.status, row.updated_at))
      .catch((err) => { onStatusChange(lead.id, prev); setPatchError(err.message || 'Could not update') })
      .finally(() => setPatching(false))
  }

  return (
    <div className={`rounded-xl border p-4 ${hot ? 'border-amber-500/40 bg-amber-500/5' : 'border-surface-border bg-surface-card'}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${hot ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-gray-400 bg-surface-dark border border-surface-border'}`}>
          {hot && <i className="bi bi-fire" aria-hidden="true" />} {lead.intent_tier}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-300">
          <i className={`bi ${channelIcon[lead.channel] || 'bi-tag'} text-accent-cyan`} aria-hidden="true" />
          {channelLabel[lead.channel] || lead.channel}
        </span>
        <time className="text-[11px] font-mono text-gray-500" dateTime={lead.created_at}>{fmtTime(lead.created_at)}</time>

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor={`status-${lead.id}`}>Status for this lead</label>
          <select
            id={`status-${lead.id}`}
            value={lead.status}
            onChange={changeStatus}
            disabled={patching}
            className="px-2 py-1 text-xs font-mono rounded-lg border border-surface-border bg-surface-dark text-gray-200 capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 disabled:opacity-50"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {lead.channel === 'email' && lead.contact_value && (
        <a href={`mailto:${lead.contact_value}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent-cyan hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 rounded">
          <i className="bi bi-envelope-at" aria-hidden="true" /> {lead.contact_value}
        </a>
      )}

      {lead.context_summary
        ? <p className="mt-2 text-sm text-gray-300 leading-relaxed break-words">{lead.context_summary}</p>
        : <p className="mt-2 text-xs font-mono text-gray-600">No context captured.</p>}

      {patchError && <p className="mt-2 text-[11px] font-mono text-red-400"><i className="bi bi-exclamation-triangle" aria-hidden="true" /> {patchError}</p>}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 rounded"
      >
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'}`} aria-hidden="true" />
        {open ? 'Hide transcript' : 'View transcript'}
      </button>

      {open && (
        <div className="mt-3 border-t border-surface-border pt-3">
          {tx.status === 'loading' && (
            <p className="text-xs font-mono text-gray-500 flex items-center gap-2"><i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" /> Loading transcript...</p>
          )}
          {tx.status === 'error' && (
            <p className="text-xs font-mono text-red-400"><i className="bi bi-exclamation-triangle" aria-hidden="true" /> {tx.error}</p>
          )}
          {tx.status === 'ok' && tx.messages.length === 0 && (
            <p className="text-xs font-mono text-gray-500">
              {tx.context
                ? 'This lead has no stored conversation (the chat was purged or never logged). The captured context is shown above.'
                : 'No transcript and no context for this lead.'}
            </p>
          )}
          {tx.status === 'ok' && tx.messages.length > 0 && (
            <ul className="space-y-2">
              {tx.messages.map((m, i) => (
                <li key={i} className="text-sm">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${m.role === 'assistant' ? 'text-accent-cyan' : 'text-gray-500'}`}>
                    {m.role === 'assistant' ? 'Alyx' : 'Visitor'}
                  </span>
                  <p className="text-gray-300 leading-relaxed break-words">
                    {m.content || <span className="text-gray-600 font-mono text-xs">(message not stored)</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Leads() {
  const [filter, setFilter] = useState('all')
  const [state, setState] = useState({ status: 'loading', rows: [], counts: { new: 0, contacted: 0, closed: 0 }, error: '' })

  const load = useCallback((f) => {
    setState((s) => ({ ...s, status: 'loading', error: '' }))
    const qs = f === 'all' ? '' : `?status=${f}`
    apiGet(`/api/admin/leads${qs}`)
      .then((d) => setState({ status: 'ok', rows: Array.isArray(d.rows) ? d.rows : [], counts: d.counts || { new: 0, contacted: 0, closed: 0 }, error: '' }))
      .catch((e) => setState((s) => ({ ...s, status: 'error', error: e.message || 'Failed to load' })))
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  // Apply a status change in place and adjust the counts so the header stays
  // truthful. The card is kept visible even when it no longer matches the active
  // filter, so a failed write can revert it and the owner can see the result; it
  // leaves the view on the next reload or filter switch.
  const onStatusChange = useCallback((id, status, updatedAt) => {
    setState((s) => {
      const prev = s.rows.find((r) => r.id === id)
      if (!prev || prev.status === status) return s
      const counts = { ...s.counts }
      if (prev.status in counts) counts[prev.status] = Math.max(0, counts[prev.status] - 1)
      if (status in counts) counts[status] += 1
      const rows = s.rows.map((r) => r.id === id ? { ...r, status, updated_at: updatedAt ?? r.updated_at } : r)
      return { ...s, counts, rows }
    })
  }, [])

  const { status, rows, counts, error } = state
  const total = counts.new + counts.contacted + counts.closed
  const countFor = (key) => key === 'all' ? total : (counts[key] ?? 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="bi bi-person-lines-fill text-accent-cyan" aria-hidden="true" /> Leads
        </h2>
        <div className="inline-flex rounded-lg border border-surface-border overflow-hidden" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-3 py-1.5 text-xs font-mono capitalize transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 ${filter === f.key ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-400 hover:text-white hover:bg-surface-card'}`}
            >
              {f.label} <span className="tabular-nums text-gray-500">{countFor(f.key)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-500 text-xs font-mono mb-6">// visitors who asked to hire, mentor with, or contact Alief - context is redacted, contact value kept only for email</p>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-gray-500 font-mono text-sm py-16 justify-center">
          <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" /> Loading leads...
        </div>
      )}

      {status === 'error' && (
        <div className="bg-surface-card border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm font-mono flex items-center justify-center gap-2 mb-3"><i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}</p>
          <button onClick={() => load(filter)} className="px-4 py-2 text-sm font-mono rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50">
            Retry
          </button>
        </div>
      )}

      {status === 'ok' && rows.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <i className="bi bi-person-plus text-3xl text-gray-600" aria-hidden="true" />
          <p className="text-white text-sm font-semibold mt-3">{filter === 'all' ? 'No leads yet' : `No ${filter} leads`}</p>
          <p className="text-gray-500 text-xs font-mono mt-1">
            {filter === 'all'
              ? 'A lead lands here when a visitor engages a hire, mentoring, or contact chip in the chat.'
              : 'Nothing in this status right now. Switch the filter to see the rest.'}
          </p>
        </div>
      )}

      {status === 'ok' && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}

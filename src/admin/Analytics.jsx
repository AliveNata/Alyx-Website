import { useCallback, useEffect, useState } from 'react'
import { apiGet } from './api'

// Series marks use the validated dark categorical slots (blue/orange/aqua);
// text and axes use ink tokens, never a series color. Grid is recessive.
const C = { blue: '#3987e5', orange: '#d95926', aqua: '#199e70' }
const GRID = '#21262d'
const INK = '#9ca3af'   // axis + muted labels
const INK2 = '#e6edf3'  // values

const RANGES = [7, 30, 90]

// pg returns counts as numbers/strings and ratios/avgs as NULL on zero-
// denominator days. Coerce counts to a number; keep ratios/avgs null when absent.
const int = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const numOrNull = (v) => { if (v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null }

const compact = (n) => {
  const v = Math.abs(n)
  if (v >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (v >= 1e4) return Math.round(n / 1e3) + 'k'
  if (v >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return String(Math.round(n))
}
const fmtInt = (n) => n.toLocaleString('en-US')
const fmtMs = (n) => n == null ? '-' : Math.round(n).toLocaleString('en-US') + ' ms'
const fmtPct = (r) => r == null ? '-' : (r * 100).toFixed(r < 0.1 ? 1 : 0) + '%'
const dayShort = (iso) => { try { return new Date(iso).toISOString().slice(5, 10) } catch { return '' } }
const dayFull = (iso) => { try { return new Date(iso).toISOString().slice(0, 10) } catch { return String(iso) } }

const niceMax = (v) => {
  if (!v || v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

// Chart frame geometry (one viewBox, scales to the card width).
const W = 720, H = 220, L = 48, R = 14, TOP = 12, BOT = 26
const plotW = W - L - R, plotH = H - TOP - BOT
const yAt = (v, max) => TOP + plotH * (1 - v / max)
const xAt = (i, n) => (n <= 1 ? L + plotW / 2 : L + plotW * (i / (n - 1)))

const tickIdx = (n) => {
  if (n <= 1) return [0]
  const count = Math.min(6, n), step = (n - 1) / (count - 1), set = new Set()
  for (let i = 0; i < count; i++) set.add(Math.round(i * step))
  return [...set]
}

// Gridlines, y labels, x-day ticks, baseline. Shared by the line and bar charts.
function Axes({ rows, yMax }) {
  const n = rows.length
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = TOP + plotH * (1 - f)
        return (
          <g key={f}>
            <line x1={L} y1={y} x2={W - R} y2={y} stroke={GRID} strokeWidth="1" />
            <text x={L - 6} y={y + 3} textAnchor="end" fontSize="9" fill={INK} fontFamily="monospace">{compact(yMax * f)}</text>
          </g>
        )
      })}
      {tickIdx(n).map((i) => (
        <text key={i} x={xAt(i, n)} y={H - 10} textAnchor="middle" fontSize="9" fill={INK} fontFamily="monospace">{dayShort(rows[i].day)}</text>
      ))}
    </>
  )
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-400">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: it.color }} aria-hidden="true" />
          {it.label}
        </span>
      ))}
    </div>
  )
}

// Build SVG path segments, breaking the line wherever a point is null.
function linePath(points) {
  const segs = []
  let cur = []
  for (const p of points) {
    if (p) cur.push(p)
    else if (cur.length) { segs.push(cur); cur = [] }
  }
  if (cur.length) segs.push(cur)
  return segs.map((s) => s.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')).join(' ')
}

function LineChart({ rows, series, label, fmt }) {
  const n = rows.length
  const vals = rows.flatMap((r) => series.map((s) => numOrNull(r[s.key]))).filter((v) => v != null)
  const yMax = niceMax(Math.max(1, ...vals))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <Axes rows={rows} yMax={yMax} />
      {series.map((s) => {
        const pts = rows.map((r, i) => { const v = numOrNull(r[s.key]); return v == null ? null : { x: xAt(i, n), y: yAt(v, yMax) } })
        return (
          <g key={s.key}>
            <path d={linePath(pts)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => p && (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={s.color}>
                <title>{`${s.label} - ${dayFull(rows[i].day)}: ${fmt(numOrNull(rows[i][s.key]))}`}</title>
              </circle>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function BarChart({ rows, dataKey, color, label }) {
  const n = rows.length
  const yMax = niceMax(Math.max(1, ...rows.map((r) => int(r[dataKey]))))
  const bw = Math.max(2, (plotW / n) * 0.62)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <Axes rows={rows} yMax={yMax} />
      {rows.map((r, i) => {
        const v = int(r[dataKey])
        const y = yAt(v, yMax)
        const h = Math.max(0, TOP + plotH - y)
        return (
          <rect key={i} x={xAt(i, n) - bw / 2} y={y} width={bw} height={h} rx="2" fill={color}>
            <title>{`${dayFull(r.day)}: ${fmtInt(v)} tokens out`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

// 100% stacked horizontal bar for a small set of categories, with a labeled
// legend (count + share). Honest when a category total is zero.
function Breakdown({ title, segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      {total === 0 ? (
        <p className="text-xs font-mono text-gray-500">No data for this range.</p>
      ) : (
        <>
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-primary">
            {segments.filter((s) => s.value > 0).map((s, i) => (
              <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color, marginLeft: i ? 2 : 0 }} title={`${s.label}: ${fmtInt(s.value)}`} />
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-[11px] font-mono">
                <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
                <span className="text-gray-300 flex-1 capitalize">{s.label}</span>
                <span className="text-white">{fmtInt(s.value)}</span>
                <span className="text-gray-500 w-10 text-right">{fmtPct(s.value / total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Tile({ icon, label, value, hint }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
        <i className={`bi ${icon} text-accent-cyan`} aria-hidden="true" /> {label}
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      {hint && <div className="text-[10px] font-mono text-gray-600 mt-1">{hint}</div>}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [state, setState] = useState({ status: 'loading', rows: [], error: '' })

  const load = useCallback((range) => {
    setState((s) => ({ ...s, status: 'loading', error: '' }))
    apiGet(`/api/admin/analytics?days=${range}`)
      .then((d) => setState({ status: 'ok', rows: Array.isArray(d.rows) ? d.rows : [], error: '' }))
      .catch((e) => setState({ status: 'error', rows: [], error: e.message || 'Failed to load' }))
  }, [])

  useEffect(() => { load(days) }, [days, load])

  const { status, rows, error } = state
  const hasData = rows.length > 0 && rows.some((r) => int(r.conversations) > 0 || int(r.messages) > 0)

  // KPIs, computed over the returned range. Latency averages are weighted by
  // assistant message count so the number is the true mean, not a mean of means.
  const sum = (k) => rows.reduce((a, r) => a + int(r[k]), 0)
  const avgOf = (k) => { const v = rows.map((r) => numOrNull(r[k])).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }
  const weightedLatency = (() => {
    let w = 0, acc = 0
    for (const r of rows) { const l = numOrNull(r.avg_latency_ms), m = int(r.assistant_messages); if (l != null && m > 0) { acc += l * m; w += m } }
    return w ? acc / w : null
  })()
  const p95Peak = (() => { const v = rows.map((r) => numOrNull(r.p95_latency_ms)).filter((x) => x != null); return v.length ? Math.max(...v) : null })()

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><i className="bi bi-graph-up text-accent-cyan" aria-hidden="true" /> Analytics</h2>
        <div className="inline-flex rounded-lg border border-surface-border overflow-hidden" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={`px-3 py-1.5 text-xs font-mono transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 ${days === r ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-400 hover:text-white hover:bg-surface-card'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-500 text-xs font-mono mb-6">// chat activity from mv_chat_daily - aggregates only, no message content</p>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-gray-500 font-mono text-sm py-16 justify-center">
          <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" /> Loading analytics...
        </div>
      )}

      {status === 'error' && (
        <div className="bg-surface-card border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm font-mono flex items-center justify-center gap-2 mb-3"><i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}</p>
          <button onClick={() => load(days)} className="px-4 py-2 text-sm font-mono rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50">
            Retry
          </button>
        </div>
      )}

      {status === 'ok' && !hasData && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <i className="bi bi-bar-chart text-3xl text-gray-600" aria-hidden="true" />
          <p className="text-white text-sm font-semibold mt-3">No chat data yet</p>
          <p className="text-gray-500 text-xs font-mono mt-1">Conversations, token use, and latency will appear here once visitors chat with Alyx.</p>
        </div>
      )}

      {status === 'ok' && hasData && (
        <div className="space-y-5">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Tile icon="bi-chat-dots" label="Conversations" value={fmtInt(sum('conversations'))} />
            <Tile icon="bi-chat-text" label="Messages" value={fmtInt(sum('messages'))} />
            <Tile icon="bi-cpu" label="Tokens out" value={fmtInt(sum('tokens_out'))} />
            <Tile icon="bi-speedometer2" label="Avg latency" value={fmtMs(weightedLatency)} />
            <Tile icon="bi-activity" label="p95 latency" value={fmtMs(p95Peak)} hint="daily peak" />
            <Tile icon="bi-shield-slash" label="Opt-out rate" value={fmtPct(avgOf('opt_out_rate'))} hint="avg of active days" />
            <Tile icon="bi-lightning-charge" label="Cache-hit rate" value={fmtPct(avgOf('cache_hit_rate'))} hint="avg of active days" />
          </div>

          {/* Time series */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Split per axis: messages dwarf conversations, so a shared scale
                flattens the conversations line. One series, one y-axis each. */}
            <Card title="Conversations per day">
              <LineChart rows={rows} fmt={(v) => fmtInt(v ?? 0)} label="Conversations per day"
                series={[{ key: 'conversations', label: 'Conversations', color: C.blue }]} />
            </Card>

            <Card title="Messages per day">
              <LineChart rows={rows} fmt={(v) => fmtInt(v ?? 0)} label="Messages per day"
                series={[{ key: 'messages', label: 'Messages', color: C.orange }]} />
            </Card>

            <Card title="Tokens out per day">
              <BarChart rows={rows} dataKey="tokens_out" color={C.blue} label="Completion tokens generated per day" />
            </Card>

            <Card title="Latency per day">
              <LineChart rows={rows} fmt={fmtMs} label="Average and p95 latency in milliseconds per day"
                series={[{ key: 'avg_latency_ms', label: 'Avg', color: C.blue }, { key: 'p95_latency_ms', label: 'p95', color: C.orange }]} />
              <Legend items={[{ label: 'Avg', color: C.blue }, { label: 'p95', color: C.orange }]} />
            </Card>

            <Card title="By mode and language">
              <div className="space-y-5">
                <Breakdown title="Mode" segments={[
                  { label: 'portfolio', value: sum('conversations_portfolio'), color: C.blue },
                  { label: 'curhat', value: sum('conversations_curhat'), color: C.orange },
                  { label: 'english', value: sum('conversations_english'), color: C.aqua },
                ]} />
                <Breakdown title="Language" segments={[
                  { label: 'id', value: sum('conversations_lang_id'), color: C.blue },
                  { label: 'en', value: sum('conversations_lang_en'), color: C.orange },
                ]} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

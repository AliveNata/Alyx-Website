import { useState, useRef, useCallback } from 'react'
import { projects, skills as skillsData, experiencesIT, experiencesFreelance } from '../data/portfolio'

// ── Database tables (computed once outside component) ────────────────────────
const DB_TABLES = {
  projects: projects.map((p, i) => ({
    id: i + 1,
    title: p.title,
    category: p.category,
    technologies: (p.tech || []).slice(0, 3).join(', '),
  })),
  skills: Object.entries(skillsData).flatMap(([category, list]) =>
    list.map(s => ({ skill: s.name, category, proficiency: s.level }))
  ),
  experience: [...experiencesIT, ...experiencesFreelance].map((e, i) => ({
    id: i + 1,
    role: e.role,
    company: e.company,
    type: e.workType,
    location: e.location,
  })),
}

// ── SQL Parser ────────────────────────────────────────────────────────────────
function parseAndRun(sql, tables) {
  const raw = sql.trim()

  // Only SELECT allowed
  if (!/^\s*SELECT\b/i.test(raw)) {
    return { error: 'Only SELECT statements are supported.' }
  }

  // Extract table name
  const fromMatch = raw.match(/\bFROM\s+(\w+)/i)
  if (!fromMatch) return { error: 'Missing FROM clause.' }
  const tableName = fromMatch[1].toLowerCase()
  if (!tables[tableName]) {
    return { error: `Table "${tableName}" not found. Available: ${Object.keys(tables).join(', ')}` }
  }

  let rows = [...tables[tableName]]

  // Parse SELECT columns
  const selectMatch = raw.match(/^SELECT\s+(.*?)\s+FROM/i)
  if (!selectMatch) return { error: 'Invalid SELECT syntax.' }
  const selectPart = selectMatch[1].trim()

  // Parse WHERE
  const whereMatch = raw.match(/\bWHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i)
  if (whereMatch) {
    const cond = whereMatch[1].trim()

    // LIKE
    const likeMatch = cond.match(/^(\w+)\s+LIKE\s+'([^']*)'/i)
    if (likeMatch) {
      const [, col, pattern] = likeMatch
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
      rows = rows.filter(r => r[col] != null && regex.test(String(r[col])))
    } else {
      // = 'value' (case-insensitive)
      const eqStrMatch = cond.match(/^(\w+)\s*=\s*'([^']*)'/i)
      // comparisons with numbers
      const numMatch = cond.match(/^(\w+)\s*(>=|<=|>|<)\s*([\d.]+)/i)
      // = number
      const eqNumMatch = cond.match(/^(\w+)\s*=\s*([\d.]+)/i)

      if (eqStrMatch) {
        const [, col, val] = eqStrMatch
        rows = rows.filter(r => r[col] != null && String(r[col]).toLowerCase() === val.toLowerCase())
      } else if (numMatch) {
        const [, col, op, valStr] = numMatch
        const val = parseFloat(valStr)
        rows = rows.filter(r => {
          const rv = parseFloat(r[col])
          if (isNaN(rv)) return false
          if (op === '>') return rv > val
          if (op === '<') return rv < val
          if (op === '>=') return rv >= val
          if (op === '<=') return rv <= val
          return false
        })
      } else if (eqNumMatch) {
        const [, col, valStr] = eqNumMatch
        const val = parseFloat(valStr)
        rows = rows.filter(r => parseFloat(r[col]) === val)
      }
    }
  }

  // ORDER BY
  const orderMatch = raw.match(/\bORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i)
  if (orderMatch) {
    const [, col, dir = 'ASC'] = orderMatch
    rows = [...rows].sort((a, b) => {
      const av = a[col], bv = b[col]
      if (typeof av === 'number' && typeof bv === 'number') {
        return dir.toUpperCase() === 'DESC' ? bv - av : av - bv
      }
      const as = String(av ?? ''), bs = String(bv ?? '')
      const cmp = as.localeCompare(bs)
      return dir.toUpperCase() === 'DESC' ? -cmp : cmp
    })
  }

  // LIMIT
  const limitMatch = raw.match(/\bLIMIT\s+(\d+)/i)
  if (limitMatch) {
    rows = rows.slice(0, parseInt(limitMatch[1]))
  }

  // Project columns
  let columns
  if (selectPart === '*') {
    columns = rows.length > 0 ? Object.keys(rows[0]) : Object.keys(tables[tableName][0] || {})
  } else {
    columns = selectPart.split(',').map(c => c.trim())
  }

  const projected = rows.map(row => {
    const r = {}
    columns.forEach(col => { r[col] = row[col] ?? null })
    return r
  })

  return { columns, rows: projected, count: projected.length }
}

// ── Sample queries ────────────────────────────────────────────────────────────
const SAMPLE_QUERIES = [
  { label: 'All projects', query: 'SELECT * FROM projects' },
  { label: 'BI & Analytics projects', query: "SELECT title, technologies FROM projects WHERE category = 'BI & Analytics'" },
  { label: 'Top 5 skills by proficiency', query: 'SELECT skill, proficiency FROM skills ORDER BY proficiency DESC LIMIT 5' },
  { label: 'Data Engineering skills', query: "SELECT * FROM skills WHERE category = 'Data Engineering'" },
  { label: 'All experience', query: 'SELECT role, company, type FROM experience' },
]

const DEFAULT_QUERY = 'SELECT * FROM projects LIMIT 5'

// ── Component ────────────────────────────────────────────────────────────────
export default function SQLPlayground() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [result, setResult] = useState(null)
  const textareaRef = useRef(null)

  const runQuery = useCallback(() => {
    const res = parseAndRun(query, DB_TABLES)
    setResult(res)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      runQuery()
    }
    // Allow tab insertion
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = query.substring(0, start) + '  ' + query.substring(end)
      setQuery(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const schemaEntries = Object.entries(DB_TABLES).map(([name, rows]) => ({
    name,
    count: rows.length,
    cols: rows.length > 0 ? Object.keys(rows[0]) : [],
  }))

  return (
    <section id="sql-playground" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="section-animate mb-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">SQL Playground</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent-green/10 text-accent-green border border-accent-green/30">
              live
            </span>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-2" />
          </div>
          <p className="mt-2 text-sm font-mono text-gray-500">
            // query Alief's portfolio database — tables: projects, skills, experience
          </p>
        </div>

        {/* Main grid */}
        <div className="section-animate grid lg:grid-cols-4 gap-6">
          {/* LEFT: Editor + Results (3/4) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Editor card */}
            <div className="rounded-xl overflow-hidden border border-surface-border bg-surface-card">
              {/* Terminal header */}
              <div className="terminal-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="terminal-dot bg-red-500" />
                    <span className="terminal-dot bg-yellow-400" />
                    <span className="terminal-dot bg-green-500" />
                  </div>
                  <span className="text-xs font-mono text-gray-400">query.sql</span>
                </div>
                <button
                  onClick={runQuery}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-mono hover:bg-accent-green/20 transition-all"
                >
                  <i className="bi bi-play-fill text-xs leading-none" />
                  Run
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={5}
                  spellCheck={false}
                  className="w-full bg-primary/80 text-accent-green font-mono text-sm p-4 resize-none outline-none border-0 leading-relaxed"
                  placeholder="SELECT * FROM projects LIMIT 5"
                />
                <span className="absolute bottom-3 right-4 text-[10px] font-mono text-gray-600">
                  Ctrl+Enter to run
                </span>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
                {result.error ? (
                  <div className="p-4 border border-red-500/30 rounded-xl bg-red-500/5 m-4">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="bi bi-exclamation-triangle-fill text-red-400 text-sm" />
                      <span className="text-xs font-mono text-red-400 font-semibold">Query Error</span>
                    </div>
                    <p className="text-sm font-mono text-red-300">{result.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Result header */}
                    <div className="terminal-header flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-400">
                        // results
                      </span>
                      <span className="text-xs font-mono text-accent-green">
                        {result.count} row{result.count !== 1 ? 's' : ''} returned
                      </span>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-surface-border bg-primary/40">
                            {result.columns.map((col) => (
                              <th
                                key={col}
                                className="px-4 py-2.5 text-left text-accent-cyan font-semibold uppercase tracking-wide whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, ri) => (
                            <tr
                              key={ri}
                              className={`border-b border-surface-border/50 ${ri % 2 === 0 ? '' : 'bg-white/[0.02]'} hover:bg-accent-cyan/5 transition-colors`}
                            >
                              {result.columns.map((col) => (
                                <td
                                  key={col}
                                  className="px-4 py-2 text-gray-300 max-w-[200px] truncate"
                                  title={String(row[col] ?? '')}
                                >
                                  {row[col] == null ? (
                                    <span className="text-gray-600 italic">null</span>
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar (1/4) */}
          <div className="flex flex-col gap-4">
            {/* Sample queries */}
            <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
              <div className="terminal-header">
                <span className="text-xs font-mono text-gray-400">// sample queries</span>
              </div>
              <div className="p-3 space-y-1.5">
                {SAMPLE_QUERIES.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(sq.query)
                      setResult(null)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-gray-300 hover:bg-accent-cyan/10 hover:text-accent-cyan border border-transparent hover:border-accent-cyan/20 transition-all group"
                  >
                    <span className="text-gray-600 group-hover:text-accent-cyan/60 mr-1">›</span>
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schema */}
            <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
              <div className="terminal-header">
                <span className="text-xs font-mono text-gray-400">// schema</span>
              </div>
              <div className="p-3 space-y-3">
                {schemaEntries.map((tbl) => (
                  <div key={tbl.name} className="rounded-lg bg-primary/40 border border-surface-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-accent-cyan font-semibold">{tbl.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">{tbl.count} rows</span>
                    </div>
                    <div className="space-y-1">
                      {tbl.cols.map((col) => (
                        <div key={col} className="flex items-center gap-1.5">
                          <i className="bi bi-dot text-xs text-gray-600 leading-none" />
                          <span className="text-[10px] font-mono text-gray-400">{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

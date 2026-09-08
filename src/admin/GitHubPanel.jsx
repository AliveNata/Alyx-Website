import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { apiGet, apiPut, apiPost } from './api'

// Render README markdown to HTML and resolve relative image/link paths to GitHub.
function renderReadme(markdown, repo, branch) {
  let html = marked.parse(markdown, { gfm: true, breaks: false })
  if (repo && branch) {
    const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}/`
    const blobBase = `https://github.com/${repo}/blob/${branch}/`
    html = html
      .replace(/(<img[^>]+src=")(?!https?:|data:|\/\/)/gi, `$1${rawBase}`)
      .replace(/(<a[^>]+href=")(?!https?:|mailto:|#|\/\/)/gi, `$1${blobBase}`)
  }
  return html
}

const inputCls = 'w-full px-3 py-2 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'

function timeAgo(iso) {
  if (!iso) return 'never'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`
}

export default function GitHubPanel() {
  const [repo, setRepo] = useState('')
  const [lastSynced, setLastSynced] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState(null) // { type, text }
  const [readme, setReadme] = useState({ loading: true, html: '', missing: false })

  useEffect(() => {
    apiGet('/api/github').then((d) => { setRepo(d.repo || ''); setLastSynced(d.last_synced_at) }).catch(() => {})
    apiGet('/api/github/readme')
      .then((d) => setReadme({ loading: false, missing: d.missing, html: d.missing ? '' : renderReadme(d.markdown, d.repo, d.branch) }))
      .catch((e) => setReadme({ loading: false, html: '', error: e.message }))
  }, [])

  const saveRepo = async () => {
    try { const d = await apiPut('/api/github', { repo: repo.trim() }); setLastSynced(d.last_synced_at); setMsg({ type: 'ok', text: 'Repo saved' }) }
    catch (e) { setMsg({ type: 'err', text: e.message }) }
  }

  const sync = async () => {
    setSyncing(true); setMsg(null)
    try {
      const r = await apiPost('/api/github/sync')
      setLastSynced(r.last_synced_at)
      setMsg({ type: 'ok', text: `Synced from ${r.source}: ${r.inserted} new, ${r.updated} updated (${r.total} scanned)` })
    } catch (e) { setMsg({ type: 'err', text: e.message }) }
    finally { setSyncing(false) }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1"><i className="bi bi-github text-accent-cyan" /> GitHub</h2>
      <p className="text-gray-500 text-xs font-mono mb-6">// mirror repo commits &amp; releases into the Changelog</p>

      <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">Repository (owner/repo)</label>
      <div className="flex gap-2 mb-2">
        <input className={inputCls} value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="AliveNata/Alyx-Website" />
        <button onClick={saveRepo} className="shrink-0 px-3 py-2 text-sm font-mono rounded-lg border border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all">Save</button>
      </div>
      {repo.includes('/') && (
        <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-accent-cyan mb-6">
          <i className="bi bi-box-arrow-up-right" /> github.com/{repo}
        </a>
      )}

      <div className="mt-6 p-4 rounded-xl border border-surface-border bg-surface-card/40 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-white">Sync changelog from GitHub</div>
          <div className="text-[11px] text-gray-500 font-mono mt-0.5">Last updated: {timeAgo(lastSynced)}</div>
        </div>
        <button onClick={sync} disabled={syncing} className="shrink-0 px-4 py-2 text-sm font-mono font-bold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50 inline-flex items-center gap-2">
          <i className={`bi bi-arrow-repeat ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      </div>

      {msg && <p className={`mt-4 text-sm font-mono ${msg.type === 'ok' ? 'text-accent-green' : 'text-red-400'}`}>{msg.text}</p>}

      <p className="text-gray-600 text-[11px] font-mono mt-5 leading-relaxed">
        Uses GitHub Releases if the repo has any, otherwise recent commits. Entries are de-duplicated, so re-syncing only adds new ones. Mirrored rows appear in the Changelog with real dates and can be reordered or deleted there.
      </p>

      {/* README preview */}
      <div className="mt-8">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2"><i className="bi bi-file-earmark-text" /> README</h3>
        {readme.loading ? (
          <p className="text-gray-500 font-mono text-sm">Loading README...</p>
        ) : readme.missing ? (
          <p className="text-gray-600 font-mono text-sm">No README found in this repo.</p>
        ) : readme.html ? (
          <div className="gh-readme border border-surface-border rounded-xl p-5 bg-surface-card/30 max-h-[520px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: readme.html }} />
        ) : (
          <p className="text-red-400 font-mono text-sm">{readme.error || 'Could not render README.'}</p>
        )}
      </div>

      {/* Minimal GitHub-README prose styling (no typography plugin) */}
      <style>{`
        .gh-readme { color: #c4cdd8; font-size: 14px; line-height: 1.7; }
        .gh-readme h1, .gh-readme h2 { border-bottom: 1px solid var(--tw-prose, #2a3444); padding-bottom: .3em; color: #fff; margin: 1.2em 0 .6em; font-weight: 700; }
        .gh-readme h1 { font-size: 1.5em; } .gh-readme h2 { font-size: 1.25em; }
        .gh-readme h3, .gh-readme h4 { color: #fff; margin: 1em 0 .5em; font-weight: 600; }
        .gh-readme a { color: #00d4ff; text-decoration: none; } .gh-readme a:hover { text-decoration: underline; }
        .gh-readme p, .gh-readme ul, .gh-readme ol, .gh-readme table { margin: .6em 0; }
        .gh-readme ul, .gh-readme ol { padding-left: 1.5em; } .gh-readme li { margin: .2em 0; }
        .gh-readme code { background: rgba(148,163,184,.15); padding: .15em .4em; border-radius: 4px; font-size: .88em; font-family: ui-monospace, monospace; }
        .gh-readme pre { background: #0a0f1c; border: 1px solid #23304a; border-radius: 8px; padding: 12px; overflow-x: auto; }
        .gh-readme pre code { background: none; padding: 0; }
        .gh-readme img { max-width: 100%; } .gh-readme table { border-collapse: collapse; }
        .gh-readme th, .gh-readme td { border: 1px solid #23304a; padding: 6px 10px; }
        .gh-readme blockquote { border-left: 3px solid #23304a; padding-left: 1em; color: #8a99ae; margin: .6em 0; }
        .gh-readme hr { border: none; border-top: 1px solid #23304a; margin: 1.2em 0; }
      `}</style>
    </div>
  )
}

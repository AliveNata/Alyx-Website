import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

export const githubRouter = Router()

const GH_HEADERS = () => {
  const h = { 'User-Agent': 'alyx-admin', Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

// GET config + last sync time (auth: admin-only surface).
githubRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await query('SELECT repo, last_synced_at FROM github_settings WHERE id = 1')
  res.json(rows[0] || { repo: '', last_synced_at: null })
})

// Save which repo to mirror (owner/repo).
githubRouter.put('/', requireAuth, async (req, res) => {
  const repo = (req.body?.repo || '').trim()
  const { rows } = await query(
    `INSERT INTO github_settings (id, repo) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET repo = $1 RETURNING repo, last_synced_at`,
    [repo],
  )
  res.json(rows[0])
})

async function ghJson(url) {
  const r = await fetch(url, { headers: GH_HEADERS() })
  if (r.status === 404) throw new Error('Repo not found (check owner/repo, and that it is public)')
  if (r.status === 403) throw new Error('GitHub rate limit reached. Try again later or set GITHUB_TOKEN.')
  if (!r.ok) throw new Error(`GitHub API ${r.status}`)
  return r.json()
}

// Map GitHub releases/commits to changelog-shaped entries (newest first).
async function fetchEntries(repo) {
  const releases = await ghJson(`https://api.github.com/repos/${repo}/releases?per_page=30`)
  if (Array.isArray(releases) && releases.length) {
    return {
      source: 'releases',
      entries: releases.map((r) => ({
        source_ref: `rel:${r.id}`,
        version: r.tag_name || '',
        date: (r.published_at || r.created_at || '').slice(0, 10),
        title: r.name || r.tag_name || 'Release',
        description: (r.body || '').trim().slice(0, 2000),
      })),
    }
  }
  const commits = await ghJson(`https://api.github.com/repos/${repo}/commits?per_page=30`)
  return {
    source: 'commits',
    entries: (commits || []).map((c) => {
      const msg = c.commit?.message || ''
      const [first, ...rest] = msg.split('\n')
      return {
        source_ref: `sha:${c.sha}`,
        version: (c.sha || '').slice(0, 7),
        date: (c.commit?.author?.date || c.commit?.committer?.date || '').slice(0, 10),
        title: first.slice(0, 120),
        description: rest.join('\n').trim().slice(0, 2000),
      }
    }),
  }
}

// Return the raw README markdown. Served from raw.githubusercontent.com, which
// is a CDN and does NOT count against the GitHub API rate limit. The client
// renders the markdown. `branch` lets it resolve relative image paths.
githubRouter.get('/readme', requireAuth, async (_req, res) => {
  const cfg = (await query('SELECT repo FROM github_settings WHERE id = 1')).rows[0]
  const repo = cfg?.repo?.trim()
  if (!repo || !/^[^/]+\/[^/]+$/.test(repo)) return res.status(400).json({ error: 'Set a valid repo first (owner/repo)' })

  const branches = ['main', 'master']
  const names = ['README.md', 'readme.md', 'README.MD']
  for (const branch of branches) {
    for (const name of names) {
      const r = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${name}`)
      if (r.ok) return res.json({ markdown: await r.text(), repo, branch, missing: false })
    }
  }
  res.json({ markdown: '', missing: true })
})

// Pull from GitHub and mirror into the changelog table (dedup by source_ref).
githubRouter.post('/sync', requireAuth, async (_req, res) => {
  const cfg = (await query('SELECT repo FROM github_settings WHERE id = 1')).rows[0]
  const repo = cfg?.repo?.trim()
  if (!repo || !/^[^/]+\/[^/]+$/.test(repo)) return res.status(400).json({ error: 'Set a valid repo first (owner/repo)' })

  const { source, entries } = await fetchEntries(repo)

  const existing = new Set((await query('SELECT source_ref FROM changelog WHERE source_ref IS NOT NULL')).rows.map((r) => r.source_ref))
  const isNew = (e) => !existing.has(e.source_ref)
  const fresh = entries.filter(isNew)

  // New synced entries go to the top (smallest sort_order), newest first.
  const base = (await query('SELECT COALESCE(MIN(sort_order), 0) AS m FROM changelog')).rows[0].m
  let inserted = 0, updated = 0
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (existing.has(e.source_ref)) {
      await query('UPDATE changelog SET version=$1, date=$2, title=$3, description=$4 WHERE source_ref=$5',
        [e.version, e.date, e.title, e.description, e.source_ref])
      updated++
    } else {
      const order = base - fresh.length + fresh.indexOf(e)
      await query('INSERT INTO changelog (version, date, title, description, source_ref, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [e.version, e.date, e.title, e.description, e.source_ref, order])
      inserted++
    }
  }

  const now = new Date().toISOString()
  await query('UPDATE github_settings SET last_synced_at = $1 WHERE id = 1', [now])
  res.json({ source, inserted, updated, total: entries.length, last_synced_at: now })
})

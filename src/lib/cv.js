// CV / resume serving on the public site (PK-18). The managed CV lives in
// site_settings.cv_url, set from the admin. When it is blank (before any upload)
// everything falls back to the static file in public/, so get_cv keeps working
// exactly as it did (no regression). Shared by the Navbar and the ChatBot get_cv
// action so both read the same source and log the same way.
import { API_BASE } from './apiBase'

// The pre-PK-18 static CV, kept as the fallback. Encoded for use as a URL.
export const STATIC_CV_URL = '/Curriculum%20Vitae%20-%20Alief%20Akbar.pdf'
export const CV_FILENAME = 'Curriculum Vitae - Alief Akbar.pdf'

// The tracked, download-only endpoint for the gated CV (PK-25). Streams the full
// PDF as an attachment and logs a hashed 'download' row server-side, so this is
// the single public path to the full file.
export const CV_DOWNLOAD_URL = `${API_BASE}/api/cv-download`

// Reads the public site settings. Resolves cv_url to the static fallback when the
// admin has not uploaded one. previewUrl + pages drive the gated viewer (PK-25);
// when previewUrl is set, the full PDF is download-only via CV_DOWNLOAD_URL and
// cvUrl is not a usable public link. Fails open to the fallback so a settings
// outage never breaks get_cv.
export async function fetchCvSettings() {
  const fallback = { cvUrl: STATIC_CV_URL, previewUrl: '', pages: 0, leadCapture: false }
  try {
    const res = await fetch(`${API_BASE}/api/settings`)
    if (!res.ok) return fallback
    const data = await res.json()
    return {
      cvUrl: (data.cv_url || '').trim() || STATIC_CV_URL,
      previewUrl: (data.cv_preview_url || '').trim(),
      pages: Number(data.cv_pages) || 0,
      leadCapture: data.cv_lead_capture === true,
    }
  } catch {
    return fallback
  }
}

// Trigger the tracked, attachment download of the gated CV. The server sets
// Content-Disposition, so a plain anchor click saves the file with a readable
// name and logs the download; no client-side blob fetch is needed. The visitor's
// action never waits on anything.
export function downloadManagedCv() {
  const a = document.createElement('a')
  a.href = CV_DOWNLOAD_URL
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Soft lead capture for the gated viewer (PK-25, reuses the PK-18 F / P3 funnel).
// The context names the real action and carries the word "email" the server's
// earned-cta guard recomputes an email lead from, so a no-conversation session
// (the Navbar viewer) still writes a lead. Best-effort: the download already
// happened, so this never blocks it. Returns true on a successful write.
export async function submitCvLead({ sessionId, email, honeypot = '' }) {
  try {
    const res = await fetch(`${API_BASE}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        channel: 'email',
        contact_value: email,
        context: 'Downloaded the CV and asked Alief to follow up by email.',
        honeypot,
      }),
    })
    return res.ok
  } catch { return false }
}

// A stable per-browser session id for CV leads fired outside the chat (the Navbar
// viewer has no conversation). Persisted so re-opening the viewer dedupes to one
// lead per browser, matching the server's (session, channel) dedup window.
const CV_SESSION_KEY = 'alyx-cv-session'
export function cvSessionId() {
  try {
    let id = localStorage.getItem(CV_SESSION_KEY)
    if (!id) { id = (crypto.randomUUID?.() || String(Date.now()) + Math.random()); localStorage.setItem(CV_SESSION_KEY, id) }
    return id
  } catch {
    return String(Date.now()) + Math.random()
  }
}

// Fire the hashed view/download log. Best-effort: the visitor's action never
// waits on it, and a failure is swallowed. keepalive lets it survive a tab that
// navigates away right after a click.
export function logCv(action) {
  try {
    fetch(`${API_BASE}/api/cv-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, referrer: document.referrer || '' }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* logging is optional, never blocks the action */ }
}

// View-before-download: open the CV in a new tab (the browser's PDF viewer).
export function viewCv(url) {
  window.open(url || STATIC_CV_URL, '_blank', 'noopener,noreferrer')
}

// Force a save with a readable filename. Fetching to a blob keeps the filename
// even cross-origin (the download attribute is ignored across origins). Any
// failure falls back to a plain anchor so the download still happens.
export async function downloadCv(url) {
  const href = url || STATIC_CV_URL
  try {
    const res = await fetch(href)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = CV_FILENAME
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  } catch {
    const a = document.createElement('a')
    a.href = href
    a.download = CV_FILENAME
    a.rel = 'noopener'
    a.click()
  }
}

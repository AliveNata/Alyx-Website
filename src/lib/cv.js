// CV / resume serving on the public site (PK-18). The managed CV lives in
// site_settings.cv_url, set from the admin. When it is blank (before any upload)
// everything falls back to the static file in public/, so get_cv keeps working
// exactly as it did (no regression). Shared by the Navbar and the ChatBot get_cv
// action so both read the same source and log the same way.
import { API_BASE } from './apiBase'

// The pre-PK-18 static CV, kept as the fallback. Encoded for use as a URL.
export const STATIC_CV_URL = '/Curriculum%20Vitae%20-%20Alief%20Akbar.pdf'
export const CV_FILENAME = 'Curriculum Vitae - Alief Akbar.pdf'

// Reads the public site settings. Resolves cv_url to the static fallback when the
// admin has not uploaded one. Fails open to the fallback so a settings outage
// never breaks get_cv.
export async function fetchCvSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`)
    if (!res.ok) return { cvUrl: STATIC_CV_URL, leadCapture: false }
    const data = await res.json()
    return {
      cvUrl: (data.cv_url || '').trim() || STATIC_CV_URL,
      leadCapture: data.cv_lead_capture === true,
    }
  } catch {
    return { cvUrl: STATIC_CV_URL, leadCapture: false }
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

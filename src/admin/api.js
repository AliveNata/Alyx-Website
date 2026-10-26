import { API_BASE as BASE } from '../lib/apiBase'
const TOKEN_KEY = 'alyx-admin-token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => { try { localStorage.setItem(TOKEN_KEY, t) } catch {} }
export const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY) } catch {} }

async function request(method, path, body) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) { clearToken(); throw new Error('Session expired - please log in again') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body ?? {})
export const apiPut = (path, body) => request('PUT', path, body ?? {})
export const apiPatch = (path, body) => request('PATCH', path, body ?? {})
export const apiDelete = (path) => request('DELETE', path)

export async function login(email, password) {
  const data = await request('POST', '/api/auth/login', { email, password })
  setToken(data.token)
  return data
}

export const checkAuth = () => request('GET', '/api/auth/me')

// Upload an image file, returns its absolute URL.
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

// Upload/replace the managed CV (PK-18 + PK-25). PDF only, enforced server-side.
// Returns the full upload result: on a gated upload { cv_preview_url, cv_pages },
// on a render-failure fallback { cv_url }. The caller refreshes its preview from
// whichever is present.
export async function uploadCv(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/admin/cv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

// Fetch the gated CV PDF for the admin preview (PK-25). The full PDF is no longer
// public, so the preview streams it through this authed endpoint and shows it as
// a blob URL (an iframe cannot carry the Bearer header). The caller must revoke
// the returned URL when it is done with it.
export async function fetchCvFileBlobUrl() {
  const res = await fetch(`${BASE}/api/admin/cv/file`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) { clearToken(); throw new Error('Session expired - please log in again') }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

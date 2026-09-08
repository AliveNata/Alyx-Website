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

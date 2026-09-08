// Single source of truth for where the API lives, used by both the public site
// (chatbot settings) and the admin panel.
//  - VITE_API_URL set   -> use it (Netlify build: https://api.alyxlabs.tech, cross-origin)
//  - unset in production -> '' (same-origin; e.g. VPS all-in-one where nginx proxies /api)
//  - unset in dev        -> local API server
export const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')).replace(/\/$/, '')

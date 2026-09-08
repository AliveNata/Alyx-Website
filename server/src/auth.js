import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db.js'
import { validatePassword } from './password.js'
import { sendMail, actionEmail } from './mailer.js'

const TOKEN_TTL = '7d'
const LINK_TTL_MIN = 30
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

// Middleware: valid Bearer token AND its token_version must still match the
// user's current one (enforces single active session + logout-on-password-change).
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET) } catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
  const { rows } = await query('SELECT token_version FROM admin_users WHERE id = $1', [payload.sub])
  if (!rows[0] || rows[0].token_version !== payload.tv) {
    return res.status(401).json({ error: 'Session ended (signed in elsewhere or password changed)' })
  }
  req.user = payload
  next()
}

async function createToken(userId, type, newPasswordHash = null) {
  const raw = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + LINK_TTL_MIN * 60000).toISOString()
  await query(
    'INSERT INTO auth_tokens (user_id, type, token_hash, new_password_hash, expires_at) VALUES ($1,$2,$3,$4,$5)',
    [userId, type, sha(raw), newPasswordHash, expires],
  )
  return raw
}

async function consumeToken(rawToken, type) {
  const { rows } = await query(
    `SELECT * FROM auth_tokens WHERE token_hash = $1 AND type = $2 AND used_at IS NULL AND expires_at > now()`,
    [sha(rawToken || ''), type],
  )
  return rows[0] || null
}

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const { rows } = await query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email.toLowerCase().trim()])
  const user = rows[0]
  const ok = user ? await bcrypt.compare(password, user.password_hash) : await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv')
  if (!user || !ok) return res.status(401).json({ error: 'Wrong email or password' })

  // Bump token_version so any other active session is invalidated (single login).
  const bumped = await query('UPDATE admin_users SET token_version = token_version + 1 WHERE id = $1 RETURNING token_version', [user.id])
  const token = jwt.sign({ sub: user.id, email: user.email, tv: bumped.rows[0].token_version }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL })
  res.json({ token, email: user.email })
})

authRouter.get('/me', requireAuth, (req, res) => res.json({ email: req.user.email }))

// --- Change password (logged in): email a verification link, apply on click ---
authRouter.post('/password/request', requireAuth, async (req, res) => {
  const { new_password } = req.body || {}
  const v = validatePassword(new_password || '')
  if (!v.ok) return res.status(400).json({ error: "Password doesn't meet the requirements: " + v.failed.join(', ') })
  const hash = await bcrypt.hash(new_password, 10)
  const raw = await createToken(req.user.sub, 'pw_change', hash)
  const link = `${appUrl()}/admin/verify-password?token=${raw}`
  const mail = actionEmail('Confirm password change', 'Click the button below to confirm the change to your Alyx admin password. The new password only takes effect after you confirm.', link, 'Confirm new password')
  await sendMail({ to: req.user.email, subject: 'Confirm password change - Alyx Admin', ...mail })
  res.json({ ok: true, email: req.user.email })
})

authRouter.post('/password/verify', async (req, res) => {
  const t = await consumeToken(req.body?.token, 'pw_change')
  if (!t) return res.status(400).json({ error: 'Invalid or expired link' })
  await query('UPDATE admin_users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2', [t.new_password_hash, t.user_id])
  await query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [t.id])
  res.json({ ok: true })
})

// --- Forgot password (public): email a reset link ---
authRouter.post('/forgot', async (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim()
  const { rows } = await query('SELECT id, email FROM admin_users WHERE email = $1', [email])
  if (rows[0]) {
    const raw = await createToken(rows[0].id, 'pw_reset')
    const link = `${appUrl()}/admin/reset?token=${raw}`
    const mail = actionEmail('Reset password', 'A password reset was requested for your Alyx admin account. Click the button below to set a new password.', link, 'Reset password')
    await sendMail({ to: rows[0].email, subject: 'Reset password - Alyx Admin', ...mail })
  }
  // Always 200 so the endpoint never reveals whether an email is registered.
  res.json({ ok: true })
})

authRouter.post('/reset', async (req, res) => {
  const { token, new_password } = req.body || {}
  const v = validatePassword(new_password || '')
  if (!v.ok) return res.status(400).json({ error: "Password doesn't meet the requirements: " + v.failed.join(', ') })
  const t = await consumeToken(token, 'pw_reset')
  if (!t) return res.status(400).json({ error: 'Invalid or expired link' })
  const hash = await bcrypt.hash(new_password, 10)
  await query('UPDATE admin_users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2', [hash, t.user_id])
  await query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [t.id])
  res.json({ ok: true })
})

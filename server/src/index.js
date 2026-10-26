import 'dotenv/config'
import express from 'express'
import 'express-async-errors' // route async errors reach the error handler instead of crashing the process
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { MulterError } from 'multer'
import { authRouter } from './auth.js'
import { crudRouter } from './crud.js'
import { personalRouter } from './personal.js'
import { portfolioRouter } from './portfolio.js'
import { chatbotRouter } from './chatbot.js'
import { githubRouter } from './github.js'
import { settingsRouter } from './settings.js'
import { RL_HEADERS } from './groq.js'
import { chatRouter } from './chat.js'
import { englishScenariosRouter } from './englishScenarios.js'
import { leadRouter } from './lead.js'
import { fitcheckRouter } from './fitcheck.js'
import { analyticsRouter } from './analytics.js'
import { leadsAdminRouter } from './leadsAdmin.js'
import { promptVersionsRouter } from './promptVersions.js'
import { promptPreviewRouter } from './promptPreview.js'
import { reindexRouter } from './reindex.js'
import { cvNotifyRouter } from './cvnotify.js'
import { uploadRouter, UPLOAD_DIR } from './upload.js'
import { RESOURCES } from './resources.js'
import { embed } from './embed.js'

const app = express()
app.set('trust proxy', 1) // behind nginx

const allowed = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / curl (no Origin) and any whitelisted site.
    if (!origin || allowed.includes(origin)) return cb(null, true)
    cb(new Error(`Origin not allowed: ${origin}`))
  },
  exposedHeaders: RL_HEADERS, // let the chatbot read Groq rate-limit headers cross-origin
}))
app.use(express.json({ limit: '1mb' }))

// Rate limits (behind nginx; trust proxy is set so the real client IP is used).
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts, try again later.' } })
const chatLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please slow down.' } })
// Light per-IP cap on lead writes (P3-2, decision G). A human engages a CTA a
// handful of times at most; the dedicated leadLimiter + honeypot land in P3-3.
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please slow down.' } })
// Admin playground (PK-1): auth-gated already, but each preview is a Groq call,
// so cap it to stop a stuck UI (or a leaked token) from draining the quota.
const previewLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please slow down.' } })
app.use('/api/auth/login', loginLimiter)   // brute-force protection
app.use('/api/auth/forgot', loginLimiter)  // don't let forgot-password be spammed
app.use('/api/chat', chatLimiter)          // protect the Groq quota from abuse
app.use('/api/lead', leadLimiter)          // light abuse cap on lead submits
app.use('/api/fitcheck', leadLimiter)      // reuse the lead cap for the JD fit-check (P3-5)
app.use('/api/admin/prompt-preview', previewLimiter) // cap playground Groq calls

// Uploaded images (served directly; nginx can also serve this path).
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/personal', personalRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/github', githubRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/english-scenarios', englishScenariosRouter)
app.use('/api/lead', leadRouter)
app.use('/api/fitcheck', fitcheckRouter)
app.use('/api/admin/analytics', analyticsRouter)
app.use('/api/admin/leads', leadsAdminRouter)
app.use('/api/admin/prompt-versions', promptVersionsRouter)
app.use('/api/admin/prompt-preview', promptPreviewRouter)
app.use('/api/admin/reindex', reindexRouter)
app.use('/api/cv-notify', cvNotifyRouter)
app.use('/api/upload', uploadRouter)
for (const [name, cfg] of Object.entries(RESOURCES)) {
  app.use(`/api/${name}`, crudRouter(cfg))
}

// JSON error handler (multer + thrown errors land here). Known client errors
// (400) keep their message; unexpected errors return a generic 500 and the
// detail is logged server-side only, so DB/internal errors never leak.
app.use((err, _req, res, _next) => {
  console.error('[api]', err.stack || err.message)
  // Multer rejections (e.g. file too large) are the caller's fault, not ours.
  // Its messages ("File too large", etc.) are safe to surface; no internals leak.
  if (err instanceof MulterError) return res.status(400).json({ error: err.message })
  const isClientError = /not allowed|only image|no file/i.test(err.message || '')
  if (isClientError) return res.status(400).json({ error: err.message })
  res.status(500).json({ error: 'Server error' })
})

// Optional embedding warm-up (P2-3, decision D). Off by default to keep idle RAM
// low; set EMBED_WARM_ON_BOOT=1 to pay the one-time model load at boot so the
// first portfolio visitor doesn't eat it. Fire-and-forget: a failure here must
// not stop the server (retrieval stays lazy and fails open per chat.js).
if (/^(1|true)$/i.test(process.env.EMBED_WARM_ON_BOOT || '')) {
  embed('warm', 'query')
    .then(() => console.log('[embed] model warmed on boot'))
    .catch((err) => console.error('[embed] warm-on-boot failed:', err.message))
}

const port = process.env.PORT || 4000
app.listen(port, '127.0.0.1', () => console.log(`Alyx API listening on :${port}`))

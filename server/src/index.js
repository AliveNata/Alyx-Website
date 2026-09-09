import 'dotenv/config'
import express from 'express'
import 'express-async-errors' // route async errors reach the error handler instead of crashing the process
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { authRouter } from './auth.js'
import { crudRouter } from './crud.js'
import { personalRouter } from './personal.js'
import { portfolioRouter } from './portfolio.js'
import { chatbotRouter } from './chatbot.js'
import { githubRouter } from './github.js'
import { settingsRouter } from './settings.js'
import { groqRouter, RL_HEADERS } from './groq.js'
import { cvNotifyRouter } from './cvnotify.js'
import { uploadRouter, UPLOAD_DIR } from './upload.js'
import { RESOURCES } from './resources.js'

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
app.use('/api/auth/login', loginLimiter)   // brute-force protection
app.use('/api/auth/forgot', loginLimiter)  // don't let forgot-password be spammed
app.use('/api/groq-chat', chatLimiter)     // protect the Groq quota from abuse

// Uploaded images (served directly; nginx can also serve this path).
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/personal', personalRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/github', githubRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/groq-chat', groqRouter)
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
  const isClientError = /not allowed|only image|no file/i.test(err.message || '')
  if (isClientError) return res.status(400).json({ error: err.message })
  res.status(500).json({ error: 'Server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Alyx API listening on :${port}`))

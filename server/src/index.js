import 'dotenv/config'
import express from 'express'
import 'express-async-errors' // route async errors reach the error handler instead of crashing the process
import cors from 'cors'
import { authRouter } from './auth.js'
import { crudRouter } from './crud.js'
import { personalRouter } from './personal.js'
import { portfolioRouter } from './portfolio.js'
import { chatbotRouter } from './chatbot.js'
import { githubRouter } from './github.js'
import { settingsRouter } from './settings.js'
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
}))
app.use(express.json({ limit: '1mb' }))

// Uploaded images (served directly; nginx can also serve this path).
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/personal', personalRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/github', githubRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/upload', uploadRouter)
for (const [name, cfg] of Object.entries(RESOURCES)) {
  app.use(`/api/${name}`, crudRouter(cfg))
}

// JSON error handler (multer + thrown errors land here).
app.use((err, _req, res, _next) => {
  console.error('[api]', err.message)
  const status = /not allowed|only image|no file/i.test(err.message) ? 400 : 500
  res.status(status).json({ error: err.message || 'Server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Alyx API listening on :${port}`))

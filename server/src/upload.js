import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { requireAuth } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED.has(ext)) return cb(new Error('Only image files are allowed'))
    cb(null, true)
  },
})

export const uploadRouter = Router()

// Returns an absolute URL the admin panel stores in the resource's image field.
uploadRouter.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
  res.status(201).json({ url: `${base}/uploads/${req.file.filename}` })
})

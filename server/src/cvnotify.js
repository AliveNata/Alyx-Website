import { Router } from 'express'
import { query } from './db.js'

function parseBrowser(ua) {
  if (/Edg\//.test(ua))     return `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ''}`
  if (/OPR\//.test(ua))     return `Opera ${ua.match(/OPR\/([\d]+)/)?.[1] ?? ''}`
  if (/Chrome\//.test(ua))  return `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ''}`
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ''}`
  if (/Safari\//.test(ua))  return `Safari ${ua.match(/Version\/([\d]+)/)?.[1] ?? ''}`
  return 'Unknown Browser'
}
function parseOS(ua) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7'
  if (/Android ([\d.]+)/.test(ua)) return `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}`
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown OS'
}

// Prefer the admin-set chat id (DB), fall back to the env value.
async function resolveChatId() {
  try {
    const { rows } = await query('SELECT telegram_chat_id FROM site_settings WHERE id = 1')
    if (rows[0]?.telegram_chat_id) return rows[0].telegram_chat_id
  } catch { /* fall back to env */ }
  return process.env.TELEGRAM_CHAT_ID || ''
}

export const cvNotifyRouter = Router()

// Sends a Telegram notification when the CV is downloaded.
cvNotifyRouter.post('/', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = await resolveChatId()
  if (!token || !chatId) return res.status(500).json({ error: 'Missing Telegram config' })

  const ip   = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown'
  const ua   = req.headers['user-agent'] || ''
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  const browser = parseBrowser(ua)
  const os = parseOS(ua)

  let location = 'Unknown'
  try {
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`).then((r) => r.json())
    if (geo.status === 'success') location = `${geo.city}, ${geo.country}`
  } catch { /* ignore geo failure */ }

  const text = [`📄 CV Downloaded!`, `⏰ ${time} WIB`, `🏙️ ${location}`, `🌐 ${ip}`, `💻 ${browser} · ${os}`].join('\n')
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => { /* don't fail the download over a notification */ })

  res.json({ ok: true })
})
